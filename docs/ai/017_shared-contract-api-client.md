# Shared Contract API Client 전환

날짜: 2026-06-09

## 이유

API 개수가 크지 않은 개인 보일러플레이트에서는 OpenAPI/Orval 산출물이 코드와 관리 요소를 늘렸다. 이미 shared Zod schema가 계약 원본이므로, FE/BE가 이를 직접 공유하는 편이 더 단순하다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- API 서버에서 Swagger/OpenAPI decorator, OpenAPI schema helper, spec emit 코드를 제거했다.
- root `openapi:generate`, API 서버 `openapi:emit`, web `codegen` script를 제거했다.
- `@nestjs/swagger`, `orval`, `openapi/api-server.json`, generated API client를 제거했다.
- shared에 표준 성공/에러 응답 envelope schema를 추가했다.
- web에 `requestApiData` typed fetch helper를 추가하고, feature API 함수가 shared Zod schema로 응답을 파싱하게 했다.
- auth/posts query hook은 generated client 대신 수동 API 함수를 사용하게 했다.
- 프로젝트 표준을 shared Zod contract 중심 API 공유 방식으로 수정했다.

## 결과

- API 계약 원본은 `@nmm/shared` Zod schema 하나로 유지된다.
- FE는 endpoint별 작은 fetch 함수를 직접 읽고 수정할 수 있다.
- OpenAPI/Orval generated 파일과 관련 script/dependency가 사라졌다.
- 검증: `npm run typecheck`, `npm run verify` 통과
- 런타임 검증: `npm run dev:api -- -d` 후 `/api/health`, `/api/posts`, auth 401, board 404 표준 응답 확인
