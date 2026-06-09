# 세션 기반 인증 설계

날짜: 2026-06-09

## 이유

인증을 먼저 구현하기 위해 OAuth2, BetterAuth, TypeORM, Nest Guard의 책임을 고정한다.
현재 web 도메인과 무관하게 여러 OAuth Provider를 확장할 수 있는 일반 레이어드 구조가 필요하다.

## 설계 결정

- 인증 방식은 JWT가 아니라 BetterAuth의 DB-backed session cookie를 사용한다.
- OAuth Provider는 BetterAuth `socialProviders`로 등록한다. 초기 Provider는 GitHub만 둔다.
- BetterAuth 기본 `user`, `session`, `account`, `verification` schema를 기준으로 한다.
- DB 테이블명은 BetterAuth 기본값을 유지한다. OAuth account는 BetterAuth `account` 모델이다.
- `user`는 `account`와 1:N 관계를 가진다.
- 사용자 기준 테이블은 BetterAuth `user`다. 별도 앱 사용자 테이블은 만들지 않는다.
- `status`, `role`은 BetterAuth `user.additionalFields`와 TypeORM `User` Entity에 함께 반영한다.
- 초기 `status`는 `PENDING`, `ACTIVE`, `SUSPENDED`만 둔다.
- 초기 `role`은 단일 값이며 `USER`, `ADMIN`만 둔다.
- TypeORM Entity/Migration은 BetterAuth core schema와 호환되게 작성한다.
- BetterAuth TypeORM adapter는 구현 시점에 공식 지원 여부와 community adapter 안정성을 검증한 뒤 선택한다.
- stateless session, cookie cache, Redis secondary storage는 초기 구현에서 제외한다.

## 인증 흐름

- web은 BetterAuth client 또는 HTTP 호출로 `/api/auth/sign-in/social`에 GitHub 로그인을 요청한다.
- BetterAuth는 `/api/auth/callback/github`에서 OAuth callback을 처리하고 `user`, `account`, `session`을 저장한다.
- 이후 web API 요청은 세션 cookie를 포함한다.
- API Guard는 요청 cookie로 BetterAuth session을 조회한다.
- 세션이 유효하면 `session.user.id`로 DB의 `user`를 조회한다.
- Guard는 DB 사용자 상태와 role을 확인한 뒤 `AuthUser`를 request에 붙인다.
- Controller는 request에 붙은 `AuthUser`를 반복 사용한다.
- OAuth access token, refresh token은 `account`에 저장하되 Controller에 노출하지 않는다.

## 사용자 상태

- `PENDING`: OAuth 인증과 세션 생성은 완료됐지만 앱 가입 절차가 끝나지 않은 사용자다.
- `ACTIVE`: 일반 인증 API를 통과할 수 있는 사용자다.
- `SUSPENDED`: 세션이 유효해도 일반 API를 통과할 수 없는 사용자다.
- OAuth callback으로 처음 생성된 사용자는 `PENDING`으로 시작한다.
- 가입 완료 API가 성공하면 `ACTIVE`로 전환한다.

## Guard 정책

Nest 전역 Guard를 기본으로 두고 handler metadata로 정책을 구분한다.

- `public`: 세션을 검사하지 않는다. OAuth 시작, OAuth callback, health check에 사용한다.
- `optional`: 세션이 없으면 익명으로 통과한다. 세션이 있으면 유효한 `ACTIVE` 사용자여야 한다.
- `required`: 세션과 `ACTIVE` 사용자가 필요하다. Controller에서는 `AuthUser`가 보장된다.
- `allowPending`: `required`와 함께 쓰며 `PENDING` 사용자도 통과시킨다.

역할 검사는 경로 문자열이 아니라 metadata로 처리한다.

- `@Roles("ADMIN")` 같은 decorator를 직접 구현한다.
- role 조건이 없으면 인증 상태만 검사한다.
- role 조건이 있으면 `AuthUser.role`과 비교한다.

## AuthUser

Controller에 노출하는 인증 객체는 DB 조회 결과에서 필요한 값만 담는다.

```ts
type AuthUser = {
  id: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  role: "USER" | "ADMIN";
  name: string | null;
  email: string;
  image: string | null;
};
```

`AuthUser`에는 session token, OAuth token, provider 원본 payload를 넣지 않는다.

## 레이어드 구조

- Presentation: Controller, Guard, decorator, request user decorator.
- Application: session 검증 orchestration, 가입 완료, 현재 사용자 조회, role/status 정책.
- Domain: `AuthUser`, `UserStatus`, `UserRole`, OAuth account 식별 규칙.
- Infrastructure: BetterAuth 설정, TypeORM Entity/Repository, migration, Provider env 설정.

예상 위치:

```text
apps/api-server/src/auth/
apps/api-server/src/users/
apps/api-server/src/oauth/
```

`apps/api-server`는 `@nmm/shared`만 workspace import로 사용한다.
`apps/web-client`는 API를 HTTP로 호출하고 세션 cookie 전송을 위해 credentials 설정을 사용한다.

## temp.md 요약

Nest는 Guard, `CanActivate`, `APP_GUARD`, `Reflector`, `SetMetadata` 같은 재료를 제공한다.
하지만 `@Public()`, `@Roles()`, `RolesGuard`, role 구조, DB role 조회, admin 정책은 직접 구현해야 한다.

대부분 endpoint를 기본 보호하려면 전역 Guard를 등록하고 공개 route만 metadata로 표시한다.
권한도 `@Roles()` metadata를 읽어 request user의 role과 비교하는 Guard를 직접 작성한다.

## 작업

- 기준 커밋: `7c37644`
- 완료 커밋: 이 메모가 포함된 커밋
- JWT 전제를 제거하고 BetterAuth session 기반 인증 설계로 정리했다.
- BetterAuth core schema를 기준으로 user, session, account 책임을 정했다.
- PENDING/ACTIVE/SUSPENDED 상태와 USER/ADMIN 단일 role 정책을 정했다.
- `public`, `optional`, `required`, `allowPending` Guard metadata 정책을 정했다.
- `temp.md`의 Nest Guard 내용을 이 문서에 요약했다.

## 결과

- 구현 전 인증 경계와 DB 기준 schema가 정해졌다.
- TypeORM adapter 선택은 구현 시점 검증 항목으로 남겼다.
- `temp.md`를 제거해도 필요한 Nest Guard 판단 근거와 원본 링크가 남는다.
- `npm run verify`가 통과했다.

## 참고

- https://better-auth.com/docs/concepts/database
- https://better-auth.com/docs/concepts/session-management
- https://better-auth.com/docs/concepts/users-accounts
- https://better-auth.com/docs/concepts/oauth
- https://better-auth.com/docs/authentication/github
- https://better-auth.com/docs/adapters/community-adapters
- https://docs.nestjs.com/security/authentication
- https://docs.nestjs.com/guards
