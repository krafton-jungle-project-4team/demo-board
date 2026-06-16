# MCP 서버 지침

## 범위

- `apps/mcp-server`에 적용한다.
- MCP 서버는 DB를 직접 읽지 않고 API 서버 endpoint만 호출한다.
- 이 앱은 workspace 코드 중 `@nmm/shared`만 import한다.
- Web, UI, React, Vite, Nest, TypeORM 코드를 import하지 않는다.

## 구조

- 루트 source에는 `index.ts`, `server.ts`, `env.ts`, `api`, `tools`를 둔다.
- API 서버 호출과 API 응답 검증은 `api`에 둔다.
- MCP tool 등록은 `tools`에 둔다.
- 파일과 `src` 하위 폴더명은 kebab-case를 지킨다.

## MCP

- SDK는 `McpServer.registerTool()` 기반으로만 사용한다.
- 모든 tool input은 Zod로 검증한다.
- 조회 전용 tool은 `readOnlyHint: true`, `destructiveHint: false`로 표시한다.
- tool 응답은 `structuredContent`와 짧은 text content를 함께 반환한다.
- API 오류는 protocol-level throw가 아니라 `isError: true` tool result로 반환한다.
- MCP client bearer token은 API 서버로 전달하지 않는다.

## 확인

- 변경 후 루트 `npm run verify`를 실행한다.
