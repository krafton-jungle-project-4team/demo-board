# 세션 사용자 조회 기준 정리

날짜: 2026-06-09

## 이유

세션 저장소가 Redis 등으로 바뀌면 세션 payload에 전체 사용자 정보를 보관하지 않을 수 있다. 인증 세션은 사용자 ID 확인에만 쓰고, API에서 쓰는 사용자 정보는 repository에서 조회한다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- `AuthQueryService`가 Better Auth 세션에서 user id만 읽게 했다.
- `UserRecord`와 `ActiveUser`는 `AuthRepository.findUser()` 결과로 만들게 했다.
- 세션 payload의 role/status/name/image/createdAt 값에 대한 의존을 제거했다.

## 결과

- 세션 저장 방식이 바뀌어도 사용자 상세 정보 기준은 DB repository에 남는다.
- 검증: `npm run typecheck`, `npm run verify` 통과
