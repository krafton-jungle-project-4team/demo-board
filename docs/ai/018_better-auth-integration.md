# Better Auth 인증 전환

날짜: 2026-06-09

## 이유

인증 설계는 Better Auth 사용을 전제로 했지만 구현은 GitHub OAuth, state, session 저장을 직접 처리하고 있었다.

## 작업

- 이 메모가 포함된 커밋에서 `better-auth`와 TypeORM adapter를 추가했다.
- `/api/auth/*`는 Better Auth handler가 처리하게 했다.
- 앱 전용 인증 API를 `/api/account/*`로 분리했다.
- Better Auth user/session/account/verification 엔티티를 TypeORM에 등록했다.
- Web 로그인/로그아웃을 Better Auth client 호출로 바꿨다.
- 직접 구현한 GitHub OAuth client, OAuth state, 자체 session 저장소를 제거했다.

## 결과

- OAuth와 세션의 source of truth가 Better Auth로 바뀌었다.
- 신규 GitHub 사용자는 `PENDING`으로 생성되고 `/auth/complete-signup`에서 앱 이름을 입력한다.
- GitHub OAuth callback URL은 `${NMM_API_ORIGIN}/api/auth/callback/github`다.
- 검증: `npm run verify`
