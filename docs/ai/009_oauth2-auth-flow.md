# OAuth2 인증 흐름 전환

날짜: 2026-06-09

## 이유

007은 DB-backed session 인증 설계였고, 008은 게시판 API 검증을 위한 임시 password/Bearer 인증이었다.
게시판 기능을 실제 로그인 흐름과 연결하려면 GitHub OAuth2, 리다이렉트, 신규 사용자 가입 완료 처리가 필요하다.

## 작업

- 기준 커밋: `596d38b`
- 완료 커밋: 이 메모가 포함된 커밋
- password 회원가입/로그인 API를 제거하고 `GET /api/auth/github/start`와 `GET /api/auth/github/callback`을 추가했다.
- GitHub authorization code를 access token으로 교환하고, `/user`, `/user/emails` 결과로 사용자와 OAuth account를 연결한다.
- 신규 OAuth 사용자는 `PENDING`으로 만들고 `/auth/complete-signup`으로 보낸다.
- `POST /api/auth/signup/complete`가 이름을 받아 사용자를 `ACTIVE`로 전환한다.
- 세션은 `nmm_session` httpOnly cookie로 저장한다. 기존 API 테스트 호환을 위해 Bearer token 판별도 유지했다.
- 게시글/댓글 쓰기 API는 cookie 또는 Bearer 세션을 읽고, `PENDING` 사용자는 차단한다.
- `apps/api-server/.env`를 서버 전용 OAuth 설정 파일로 사용하고 Git 추적에서 제외했다.
- web에 GitHub 로그인 링크, 가입 완료 화면, 인증 실패 화면을 추가했다.
- OpenAPI spec과 generated client를 새 auth API에 맞춰 갱신했다.

## 설정

- `NMM_OAUTH_GITHUB_CLIENT_ID`: GitHub OAuth App client id
- `NMM_OAUTH_GITHUB_CLIENT_SECRET`: GitHub OAuth App client secret
- `NMM_API_ORIGIN`: API origin, 기본값 `http://localhost:3000`
- `NMM_WEB_ORIGIN`: web origin, 기본값 `http://localhost:5173`
- GitHub OAuth callback URL: `${NMM_API_ORIGIN}/api/auth/github/callback`
- 실제 값은 `apps/api-server/.env`에 저장한다. 이 파일은 커밋하지 않는다.

## 결과

- password 기반 임시 인증 대신 실제 GitHub OAuth2 리다이렉트 흐름이 생겼다.
- 신규 사용자는 OAuth 인증 직후 앱 가입 완료 단계를 거쳐야 일반 쓰기 API를 사용할 수 있다.
- 아직 DB/BetterAuth 구현은 아니므로 user, account, session은 in-memory로 유지된다.
- `apps/api-server/.env`에 GitHub OAuth App 값을 설정한 뒤 실제 GitHub 로그인 성공을 확인했다.
- `npm run openapi:generate`, `npm run build -w @nmm/web-client`, `npm run typecheck -w @nmm/api-server`,
  `npm run verify`가 통과했다.

## 참고

- https://docs.github.com/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- https://docs.github.com/rest/users/emails/
