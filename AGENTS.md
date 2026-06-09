# Repository Guidelines

## 문서 작성

- 문서는 같은 의미를 유지하는 한 가장 짧게 쓴다.
- 불필요한 미사여구와 반복 설명을 쓰지 않는다.

## 프로젝트 표준

- 변경 후 `npm run verify`로 lint, format check, typecheck, build를 함께 확인한다.
- 개발 서버는 루트 npm script로만 실행한다. API 서버는 Docker Compose를 감싼 `npm run dev` 또는 `npm run dev:api`만 사용한다.
- API 서버를 직접 `nest start`, workspace `start:dev`, 임의 환경 변수 조합으로 실행하지 않는다. 로컬 환경 의존이 실행마다 달라지는 것을 막기 위함이다.
- 모듈 경계는 `docs/project-standards.md`와 `eslint.config.mjs`를 따른다.
- `apps/web-client`는 `@nmm/shared`만 workspace import로 사용하고 API는 HTTP로 호출한다.
- `apps/api-server`는 `@nmm/shared`만 workspace import로 사용하고 web 코드를 import하지 않는다.
- `packages/shared`는 앱, React, Nest, Node 런타임, DB를 import하지 않는다.

## AI 작업 기록

- AI가 수행한 구체적이고 의미 있는 작업은 `docs/ai/` 아래에 기록한다.
- 기록은 채팅 없이 이해될 만큼 충분하되, 같은 의미를 담는 한 최대한 간결하게 쓴다.
- 하나의 큰 작업과 그 메모 작성은 같은 작업 단위로 묶고, 가능하면 같은 커밋에 포함한다.
- 각 기록은 이유, 작업(관련 커밋), 결과(검증/후속 작업)를 포함한다.
- 메모가 포함된 현재 커밋을 가리킬 때는 해시 대신 `이 메모가 포함된 커밋`으로 적고, 이미 존재하는 관련 커밋만 해시로 적는다.
- 파일명은 순번으로 시작한다. 예: `docs/ai/001_example-task.md`.
- 날짜는 파일명 대신 문서 내부에 적는다.
