# API 경계와 도메인 구조 정리

날짜: 2026-06-09

## 이유

Controller, service, repository, common 코드의 책임이 섞여 있었다. 외부 입력 검증과 인증은 controller 경계에서 끝내고, service는 검증된 request/user와 도메인 repository에 집중해야 한다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- Controller가 shared Zod schema로 body/query/param을 파싱한 뒤 service에 넘기게 했다.
- 인증 필요 endpoint는 guard가 Better Auth DB-backed session을 검증하고 `@CurrentUser()`로 user를 받게 했다.
- 게시글/댓글/태그 ID를 DB `bigint` auto-increment로 바꾸고, API ID는 숫자로 다루게 했다.
- board/auth의 provider 명칭을 repository 계약으로 바꾸고, TypeORM repository class를 구현체로 정리했다.
- auth entity를 domain으로 옮기고, auth command service의 raw SQL/DataSource 의존을 제거했다.
- 도메인 에러 정의 공통 헬퍼를 `common/core/domain`에 추가했다.
- `common`을 순수 코드 `common/core`와 전역 인프라 `common/infra`로 분리했다.
- 프로젝트 표준에 위 기준을 반영했다.

## 결과

- Controller는 외부 입력과 인증 경계를 담당하고, service는 검증된 값으로 도메인 작업을 수행한다.
- 생성 리소스 ID 생성 책임은 DB로 이동했다.
- Auth와 board가 같은 domain repository 계약, database 구현체 구조를 따른다.
- 공통 코드는 순수 코드와 프레임워크/런타임 의존 코드로 분리됐다.
- 검증: `npm run typecheck`, `npm run verify`, `npm run format:check` 통과
