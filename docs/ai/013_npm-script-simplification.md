# NPM script 정리

날짜: 2026-06-09

## 이유

스크립트가 늘어나면서 사용자가 어디서 무엇을 실행해야 하는지 흐려졌다. 모든 작업은 루트에서 실행하고, 자식 script는 루트가 호출하는 내부 도구 명령으로만 두는 기준이 필요했다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- 루트 script를 public 진입점으로 정리했다.
- 실행 순서가 숨는 `predev`를 제거하고 `dev`, `dev:web`에 shared build를 명시했다.
- `typecheck`는 workspace 자동 탐색 대신 `shared`, `ui`, `web-client`, `api-server` 순서를 직접 적었다.
- `build:web`, `build:api`는 필요한 shared build를 포함하게 했다.
- `openapi:spec`를 제거하고 `openapi:generate`에 spec 생성과 web codegen 흐름을 직접 적었다.
- 루트의 `dev:shared`, `build:shared`, `docker:api:build`를 제거했다.
- web-client의 미사용 `preview`를 제거했다.
- 프로젝트 표준에 루트 script와 workspace 내부 script의 역할을 남겼다.

## 결과

- 루트에서 실행할 수 있는 작업만 사용자 진입점으로 남았다.
- workspace script는 build/typecheck/codegen/routes 같은 도구 호출로 제한했다.
- Docker API 개발 서버 실행은 계속 `npm run dev:api`만 사용한다.
- 검증: `npm run openapi:generate`, `npm run format:check`, `npm run verify` 통과
