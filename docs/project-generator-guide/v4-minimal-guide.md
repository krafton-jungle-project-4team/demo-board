# 프로젝트 생성 가이드 v4 최소판

날짜: 2026-06-12

## 목표

원본 복사 없이 같은 starter를 만든다. 이름/문구는 자유. 구조, 세션 사용자, SQL-first DB, shared Zod contract, API envelope, UI primitive, FE 품질 루프는 유지.

## 금지

- 원본 파일 복사
- scaffold 파일 수동 작성
- API/auth in-memory store: 배열, Map, singleton, `board-store.ts`
- `synchronize: true`
- Web -> API/Nest/Node import
- API -> Web/UI import
- shared -> React/Nest/Node/DB import

## CLI

`docs/generation/commands.md`에 기록.

```bash
npm init -y
mkdir -p apps packages docs/generation docs/ai .codex/skills
npm create vite@latest apps/web-client -- --template react-ts
cd apps && npx @nestjs/cli@latest new api-server --strict --package-manager npm --skip-install --skip-git
```

shadcn/ui와 TanStack Router는 공식 CLI/문서 절차 사용. shadcn이 `packages/ui`에서 막히면 web에서 init/add 후 같은 API를 `packages/ui`에 정리하고 기록.

## 루트

필수:

```text
compose.yml
eslint.config.mjs
prettier.config.mjs
package.json
apps/api-server
apps/web-client
packages/shared
packages/ui
docs/{ai,generation}
.codex/skills
```

scripts: `dev`, `dev:all`, `dev:web`, `dev:api`, `dev:db`, `dev:db:stop`, `preview:web`, `build`, `build:web`, `build:api`, `typecheck`, `lint`, `format`, `format:check`, `verify`.

- `verify = lint && format:check && typecheck && build`
- `dev:api = docker compose --env-file apps/api-server/.env up --build api-server`
- `dev:db = docker compose --env-file apps/api-server/.env up -d postgres`
- npm workspaces: `apps/*`, `packages/*`
- Prettier 4칸/120자
- ESLint: TS, Hooks, kebab-case, 모듈 경계, JSX 익명 함수 금지
- Husky/lint-staged
- 폴더별 `AGENTS.md`: root, web, api, shared, ui, docs, skills

## Compose

루트 `compose.yml`: `postgres`와 `api-server`.

- Postgres: required env, healthcheck, named volume
- API: `apps/api-server/Dockerfile` development target, `apps/api-server/.env`, 루트 mount, node_modules volume

## shared

`packages/shared`: Zod + tsup, ESM/CJS/types export.

```text
src/contracts/{api.contract.ts,auth.contract.ts,post.contract.ts}
src/index.ts
```

Contract:

- envelope: `{ requestId, data }`, `{ requestId, error: { code, message } }`
- auth: `USER|ADMIN`, `PENDING|ACTIVE|SUSPENDED`, `User`, complete signup, update me
- board: numeric id, post query/sort/view, tag/post/comment, list/create/update/delete schemas

Controller/Web은 schema parse. Service는 infer type. Command는 id만 반환.

## ui

`packages/ui`: shadcn/Radix primitive.

```text
components.json
src/components.ts
src/components/{button,input,textarea,select,label,field,card,badge,table,dialog,separator}.tsx
src/lib/utils.ts
src/styles/globals.css
```

앱은 `@project/ui/components`. `cn`은 UI 내부. UI는 앱/API/shared 도메인 import 금지. Radix 또는 `radix-ui`, lucide, cva, clsx, tailwind-merge, tw-animate-css 사용.

## API

Nest strict. deps: Nest, TypeORM, pg, dotenv, zod, nestjs-pino, pino-http, shared.

```text
src/main.ts
src/app.module.ts
src/app-errors.ts
src/core/assert.ts
src/infra/env/{env-file.ts,server-env.ts,index.ts}
src/infra/database/{database.config.ts,database.module.ts,index.ts}
src/infra/http/{api-response.ts,api-response.interceptor.ts,api-exception.filter.ts,index.ts}
src/features/{auth,board,health}
```

- global prefix `api`
- CORS env web origin + credentials
- request id: `x-request-id` 또는 UUID, response header
- success/error envelope 전역 적용
- env: `apps/api-server/.env` 필수, Zod parse, `.env.example`
- DB config: `synchronize: false`

## DB

SQL이 원본.

```text
apps/api-server/database/init-db.sql
apps/api-server/database/dummy-data.sql
```

Tables: `user`, `session`, `account`, `verification`, `posts`, `post_tags`, `post_tag_links`, `comments`.

Entity는 SQL mapping/API 변환. seed는 SQL only. id는 DB auto increment.

## auth

로그인 provider는 OAuth/ID-password/stub 자유. 세션/current user는 DB-backed.

```text
auth.module.ts
auth.model.ts
auth.env.ts
auth-errors.ts
controller/{auth-request.ts,current-auth.decorator.ts,session-user.guard.ts,active-account.guard.ts,auth.controller.ts}
service/{auth-query.service.ts,auth-command.service.ts}
database/{user.entity.ts,session.entity.ts,account.entity.ts,verification.entity.ts,index.ts}
index.ts
```

- `AuthClaims = { userId, sessionId, role, status }`
- guard가 cookie/authorization 세션 검증, controller는 `@CurrentAuth()`
- pending 허용/active-only guard 분리, suspended 차단
- role/status 변경 시 DB session 만료/삭제
- `InjectRepository(UserEntity)`, `InjectRepository(SessionEntity)`
- API: `GET /api/account/me`, `POST /api/account/complete-signup`, `PATCH /api/account/me`

## board

```text
board.module.ts
board-errors.ts
controller/{posts.controller.ts,comments.controller.ts,post-tags.controller.ts}
service/{board-query.service.ts,board-command.service.ts}
database/{post.entity.ts,post-tag.entity.ts,post-tag-link.entity.ts,comment.entity.ts,index.ts}
index.ts
```

API: posts list/detail/create/update/delete, comments list/create/update/delete, `GET /api/post-tags`.

- controller는 shared schema parse
- writes는 active account guard
- query service: Post/Tag/Link/Comment/User `InjectRepository`
- command service: `InjectDataSource`/`DataSource.transaction()`
- authorId 저장, authorName은 user table 조회
- 작성자 또는 ADMIN만 수정/삭제

## Web

Vite React TS. deps: TanStack Router/plugin/CLI, Query, ky, nuqs, RHF, Zod resolver, shared, ui.

```text
src/main.tsx
src/index.css
src/app/{providers,root,router.tsx}
src/routes
src/pages/{auth,posts}
src/features/auth/{api,model,index.ts}
src/features/posts/{api,hooks,model,ui,index.ts}
src/shared/api/http-client.ts
src/shared/env/client-env.ts
```

Routes: `/`, `/posts`, `/posts/new`, `/posts/$postId`, `/posts/$postId/edit`, `/me`, `/auth/complete-signup`, `/auth/error`.

- routes는 page 연결/search 검증
- HTTP: ky `/api`, credentials include, shared envelope parse, typed error
- React Query hooks는 feature에 직접
- Suspense query pending, ErrorBoundary query error, mutation pending은 이벤트 UI
- `handle*` handlers, JSX 익명 함수 금지
- RHF + Zod resolver + shared contract
- UI primitive 우선

## Skills

`.codex/skills`: `toss-frontend-fundamentals`, `vercel-react-best-practices`, `vercel-composition-patterns`, `web-design-guidelines`, `writing-guidelines`.

각각 `SKILL.md`. 외부 skill은 원본 URL/license/범위 기록. FE 루프: `verify` -> React Doctor 또는 불가 사유 -> Toss -> Vercel React -> 수정 -> `verify`.

실제 작업 프롬프트 검증은 `docs/project-generator-guide/prompt-harness.md`를 따른다. 생성 프로젝트는 `docs/generation/prompt.md`, `skill-usage.md`, `feature-prompt.md`, `feature-task-result.md`를 남긴다.

## 검증

실패해야 함:

```bash
rg "board-store|Post\\[\\] =|UserRecord\\[\\]|new Map" apps/api-server/src/features
```

성공해야 함:

```bash
rg "InjectRepository|DataSource" apps/api-server/src/features/board/service
rg "InjectRepository" apps/api-server/src/features/auth/service
rg "synchronize: false" apps/api-server/src
npm run verify
```

결과는 `docs/generation/result.md`.
