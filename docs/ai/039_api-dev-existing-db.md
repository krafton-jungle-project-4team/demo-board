# API dev 기존 DB 연결

날짜: 2026-06-10

## 이유

`npm run dev`는 전체 개발 서버 실행으로 유지하고, API 단독 실행은 기존 DB 컨테이너에 붙어야 한다.

## 작업

- 이 메모가 포함된 커밋에서 `npm run dev`를 `dev:all` 별칭으로 되돌렸다.
- `npm run dev:db`를 추가해 Postgres를 명시적으로만 시작하게 했다.
- `dev:api`의 Compose 대상에서 Postgres 자동 시작 의존성을 제거했다.

## 결과

- `docker compose --env-file apps/api-server/.env config api-server`에서 Postgres 의존성이 없음을 확인했다.
- `npm run verify` 통과.
