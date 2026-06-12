# API 서버 지침

## 범위

- `apps/api-server`에 적용한다.
- 이 앱은 workspace 코드 중 `@nmm/shared`만 import한다.
- Web, UI, React, Vite 코드를 import하지 않는다.

## 구조

- 루트 source에는 `main.ts`, `app.module.ts`, `app-errors.ts`, `core`, `infra`, `features`를 둔다.
- Feature 폴더는 `controller`, `service`, `database`, 필요한 경우 `index.ts`를 쓴다.
- 읽기/query service와 쓰기/command service를 분리한다.

## API

- Controller는 params/query/body/response를 shared Zod contract로 검증한다.
- Service는 schema 값이 아니라 shared contract type을 쓴다.
- 성공 응답은 `{ requestId, data }`다.
- 에러 응답은 `{ requestId, error: { code, message } }`다.

## 인증과 DB

- Controller method는 guard와 `@CurrentAuth()`로 auth를 받는다.
- Controller에서 cookies/headers를 직접 읽지 않는다.
- SQL script를 DB schema와 seed source로 삼는다.
- TypeORM `synchronize`는 false로 둔다.
- API CRUD는 memory store가 아니라 TypeORM repository/DataSource를 쓴다.

## 확인

- 변경 후 루트 `npm run verify`를 실행한다.
- API dev server는 루트 `npm run dev` 또는 `npm run dev:api`로만 실행한다.
