# API DB 재초기화와 500 원인 로그

날짜: 2026-06-10

## 이유

`GET /api/posts`가 `relation "user" does not exist`로 500을 반환했다. pino-http 요청 로그만으로는 원본 예외가 보이지 않아 원인 파악도 어려웠다.

## 작업

- 이 메모가 포함된 커밋에서 `init-db.sql`이 기존 API 테이블을 drop한 뒤 재생성하게 했다.
- 전역 exception filter가 500 응답을 만들 때 원본 예외 stack을 로그로 남기게 했다.

## 결과

- 사용자가 로컬 DB에 SQL을 적용한 뒤 `GET /api/posts?page=1&pageSize=10&sort=created-desc&view=table` 200 응답을 확인했다.
- `npm run verify`가 통과했다.
