# AuthClaims 세션 경계 정리

날짜: 2026-06-10

## 이유

세션은 Redis 등으로 옮겨질 수 있으므로 프로필 전체를 사용자 객체로 들고 있지 않는다. 세션에는 인증/인가에 필요한 최소 claims만 두고, `name` 같은 프로필 정보는 필요할 때 DB에서 조회한다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- `AuthClaims`를 추가해 `userId`, `sessionId`, `role`, `status`를 세션 인증 결과로 다루게 했다.
- `CurrentUser`를 `CurrentAuth`로 바꾸고, guard가 request에 `AuthClaims`만 저장하게 했다.
- `/account/me`와 게시글/댓글 작성처럼 프로필 정보가 필요한 흐름은 `AuthQueryService`가 DB 사용자 정보를 조회하게 했다.
- 가입 완료 시 현재 세션을 제외한 사용자 세션을 service에서 만료하게 했다.
- 프로젝트 표준에 claims와 프로필 조회 경계를 기록했다.

## 결과

- 세션 claims와 DB 사용자 프로필이 분리됐다.
- 권한 기반 가드는 `AuthClaims`의 `role/status`를 사용할 수 있다.
- 검증: `npm run typecheck`, `npm run verify` 통과
