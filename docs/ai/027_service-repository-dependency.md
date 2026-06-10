# Service repository 의존 정리

날짜: 2026-06-10

## 이유

Query service와 command service가 서로 호출하면 service 간 실행 순서와 책임이 섞인다. 같은 데이터가 필요하면 각 service가 같은 TypeORM repository를 직접 쓰는 편이 현재 레이어드 구조에 맞다.

## 계획

- service 폴더에서 다른 service 주입을 제거한다.
- auth command service는 auth query service 대신 `UserEntity`/`SessionEntity` repository를 직접 쓴다.
- board command service는 board query/auth query service 대신 board entity repository와 DataSource를 직접 쓴다.
- 생성 리소스는 세션 claims의 사용자 ID만 저장한다.
- 작성자 이름은 저장하지 않고 read service에서 user repository로 조회한다.
- DB 스키마와 더미 데이터는 SQL 파일로만 관리한다.
- 공통 DB 값 정규화와 API 객체 변환은 entity의 `from`, `to*` 메서드에 둔다.
- 프로젝트 표준에 service 간 의존 금지 규칙을 추가한다.

## 실행

- 관련 커밋: 이 메모가 포함된 커밋
- `UserEntity`에 `from`, `toUser`, `toUserStatus`를 추가했다.
- `AuthCommandService`가 `AuthQueryService`를 주입하지 않고 사용자 재조회와 세션 삭제를 직접 수행하게 했다.
- 세션은 있는데 사용자 DB row가 없으면 인증 실패가 아니라 데이터 불일치로 보고 일반 예외를 던지게 했다.
- `AuthClaims`는 `userId`, `sessionId`, `role`, `status`만 유지하게 했다.
- `BoardCommandService`가 `BoardQueryService`, `AuthQueryService`를 주입하지 않고 post/comment/tag repository와 `AuthClaims`를 직접 쓰게 했다.
- board command는 게시글/댓글에 `authorId`만 저장하고, board query가 `UserEntity` repository로 `authorName`을 만든다.
- board query는 사용자 목록을 읽고 각 read method 안에서 작성자 이름을 매칭하게 했다.
- board service의 `map`/`filter`/`some` 가공에 중간 변수 이름을 붙였다.
- board query의 이름 매칭/필터/정렬 private helper를 제거했다.
- board query의 외부 호출 대상이 아닌 method를 private으로 내렸다.
- 단순 tag 조회 helper를 호출 method 안으로 합쳤다.
- TypeORM repository가 반환한 board entity를 같은 entity 타입으로 다시 매핑하지 않게 했다.
- `ASSERT_*` 유틸을 추가하고 입력을 조건과 설명만 받게 했다.
- 작성자 누락 검증에 `ASSERT_THROW`를 적용했다.
- board command의 앱 시작 seed를 제거했다.
- `apps/api-server/database/init-db.sql`, `apps/api-server/database/dummy-data.sql`을 추가했다.
- TypeORM `synchronize` 설정을 제거하고 false로 고정했다.
- `docs/project-standards.md`에 service 간 service 주입 금지와 repository 직접 사용 규칙을 추가했다.

## 결과

- service 폴더 안의 service import와 service 주입이 사라졌다.
- board command는 작성자 ID만 저장한다.
- board query는 응답 작성 시 작성자 이름을 user DB에서 읽는다.
- DB 초기화와 더미 데이터 입력은 SQL 파일이 기준이다.
- query/command service 분리는 유지했다.
- 검증: `npm run verify` 통과
