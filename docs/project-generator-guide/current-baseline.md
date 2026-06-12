# 현재 기준선

날짜: 2026-06-12

## 목적

가이드만 보고 생성한 프로젝트가 현재 코드베이스의 기능, 구조, 구현 패턴을 얼마나 재현했는지 평가하기 위한 기준선이다.

## 제품 범위

- 게시판 도메인은 샘플 기능이다.
- 보일러플레이트의 본질은 full-stack 개발 루프, 세션 사용자 처리, SQL-first DB, shared contract, UI primitive, Codex skill 기반 FE 품질 개선이다.

## 워크스페이스

```text
apps/
  api-server/
  web-client/
packages/
  shared/
  ui/
docs/
  ai/
.codex/
  skills/
```

## 루트 표준

- npm workspaces를 사용한다.
- 사용자가 실행하는 명령은 루트 `package.json` script로 제공한다.
- 필수 script: `dev`, `dev:all`, `dev:web`, `dev:api`, `dev:db`, `dev:db:stop`, `preview:web`, `build`, `build:web`, `build:api`, `typecheck`, `lint`, `format`, `format:check`, `verify`.
- `verify`는 lint, format check, typecheck, build를 모두 수행한다.
- Prettier는 4칸 들여쓰기와 120자 print width를 사용한다.
- ESLint는 파일명, 폴더명, React Hooks, 모듈 경계를 검증한다.

## 모듈 경계

| 모듈              | 허용                                             | 금지                               |
| ----------------- | ------------------------------------------------ | ---------------------------------- |
| `apps/web-client` | React, Vite, `@nmm/shared`, `@nmm/ui`, 내부 코드 | API 서버 코드, Nest, Node 런타임   |
| `apps/api-server` | Nest, Node 런타임, `@nmm/shared`, 내부 코드      | Web/UI 코드, React, Vite           |
| `packages/shared` | Zod, 순수 타입/계약                              | 앱 코드, React, Nest, Node, DB     |
| `packages/ui`     | React, shadcn/ui primitive, Radix, lucide        | 앱 도메인, API 서버, shared 도메인 |

## API 서버 기준

- Nest 기반이다.
- 소스 루트는 `main.ts`, `app.module.ts`, `app-errors.ts`, `core`, `infra`, `features`로 나뉜다.
- `infra/http`는 request id, success envelope, error envelope, exception filter, response interceptor를 담당한다.
- JSON 성공 응답은 `{ requestId, data }`다.
- JSON 실패 응답은 `{ requestId, error: { code, message } }`다.
- `features/health`는 `/api/health`를 제공한다.
- 기능 feature는 `controller`, `service`, `database`를 우선 사용한다.
- service는 query/read와 command/write 파일로 나눈다.
- repository interface 레이어는 두지 않는다.
- service가 다른 service를 주입하지 않는다.

## 인증 기준

- 세션 기반 사용자 처리는 필수다.
- 로그인 방식은 강제하지 않는다. OAuth, ID/password, magic link 등을 provider adapter로 교체할 수 있어야 한다.
- API controller는 cookie/header를 직접 읽지 않는다.
- guard가 세션을 검증하고 request에 `AuthClaims`를 둔다.
- controller는 `@CurrentAuth()`로 claims를 받는다.
- `AuthClaims`는 `userId`, `sessionId`, `role`, `status`만 포함한다.
- `role`은 `USER`, `ADMIN`이다.
- `status`는 `PENDING`, `ACTIVE`, `SUSPENDED`다.
- pending 사용자를 허용하는 guard와 active 사용자만 허용하는 guard를 구분한다.
- 앱 전용 계정 API는 shared contract와 표준 envelope를 사용한다.
- provider 전용 auth callback 라우트는 필요하면 표준 envelope 예외로 둘 수 있다.

## DB 기준

- Postgres를 Docker Compose로 실행한다.
- DB 스키마 원본은 SQL script다.
- `apps/api-server/database/init-db.sql`은 schema를 만든다.
- `apps/api-server/database/dummy-data.sql`은 개발용 데이터를 넣는다.
- TypeORM `synchronize`는 사용하지 않는다.
- TypeORM은 entity mapping, query, schema 검증 용도로 사용한다.
- DB 변경은 SQL script를 먼저 바꾸고 entity를 맞춘다.

## Web 기준

- Vite React TypeScript 앱이다.
- TanStack Router file-based routing을 사용한다.
- TanStack Query를 사용한다.
- ky 기반 HTTP client를 둔다.
- React Hook Form과 Zod resolver를 폼 기본 패턴으로 쓴다.
- `app`은 전역 provider, router, root route UI를 담당한다.
- `routes`는 route 연결과 search 검증만 담당한다.
- `pages`는 화면 조립 단위다.
- `features/<domain>`은 `api`, `model`, `hooks`, `ui`, `lib`, `index.ts` 구조를 우선한다.
- Suspense는 조회 pending을 담당한다.
- ErrorBoundary는 조회 error를 담당한다.
- mutation pending은 이벤트 UI에서 직접 다룬다.
- JSX 안 익명 함수식은 금지한다.

## UI 기준

- `packages/ui`는 앱 독립 primitive 패키지다.
- shadcn/ui CLI 대상은 `packages/ui`다.
- 앱은 `@nmm/ui/components`에서 primitive를 가져온다.
- shadcn 대체 가능한 button, input, card, table, select, dialog, badge, field는 raw HTML 대신 primitive를 우선 사용한다.
- `cn`은 UI 패키지 내부에만 둔다.
- 앱별 CSS selector와 직접 theme token 추가를 피한다.

## Shared contract 기준

- `packages/shared/src/contracts`가 API 요청/응답 원본이다.
- Zod schema와 infer type을 함께 export한다.
- Web HTTP 함수와 API controller는 같은 schema로 경계를 검증한다.
- service는 schema 값 대신 contract type을 사용한다.
- resource id는 API 객체에서 숫자로 다루고 URL 경계에서만 숫자로 파싱한다.

## 샘플 도메인 기준

- 게시글 목록, 상세, 생성, 수정, 삭제를 제공한다.
- 댓글 목록, 생성, 수정, 삭제를 제공한다.
- 태그 목록과 게시글 태그 연결을 제공한다.
- 작성자 ID는 저장하고, 작성자 이름은 read service에서 사용자 데이터를 조회해 만든다.
- command API는 전체 리소스가 아니라 생성/변경/삭제된 id를 반환한다.

## Codex skill 기준

- `.codex/skills`에 프로젝트 전용 skill을 둔다.
- Toss Frontend Fundamentals 기반 skill을 유지한다.
- Vercel agent skills 중 React, composition, view transitions, optimize, deploy 관련 skill을 유지한다.
- skill은 짧은 `SKILL.md`와 필요한 `references`로 구성한다.
- 외부 자료를 변환한 skill은 원본 URL, 적용 범위, 제외 범위를 metadata나 문서에 남긴다.
- FE 변경은 Toss 기준, Vercel React best practices, React Doctor 진단을 반복해서 개선한다.
- 실제 작업 프롬프트는 `docs/generation/skill-usage.md`에 적용한 스킬과 제외 이유를 남긴다.

## 작업 하네스 기준

- 생성 프로젝트는 root, web, api, shared, ui, docs, skills 폴더에 `AGENTS.md` 문맥을 둔다.
- 생성 후 특정 도메인 작업을 추가해 구조가 확장되어도 규칙이 유지되는지 확인한다.
- 기본 검증 도메인은 `bookmarks`다.
- 생성 후 단순 기능 프롬프트는 `docs/generation/feature-prompt.md`에 남긴다.
- 기능 작업 결과는 `docs/generation/feature-task-result.md`에 남긴다.
- 하네스 프롬프트 원문은 `docs/generation/prompt.md`에 남긴다.

## 공식 CLI 근거

- Vite는 `npm create vite@latest`와 `react-ts` template을 제공한다: https://vite.dev/guide/
- Nest CLI는 `nest new`, `--strict`, `--skip-install`, `--skip-git`, `--package-manager` 옵션을 제공한다: https://docs.nestjs.com/cli/usages
- shadcn/ui CLI는 existing project init과 monorepo 지원을 제공한다: https://ui.shadcn.com/docs/cli, https://ui.shadcn.com/docs/monorepo
- TanStack Router는 Vite file-based routing과 router plugin을 제공한다: https://tanstack.com/router/v1/docs/installation/with-vite
