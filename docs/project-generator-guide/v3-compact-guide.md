# 프로젝트 생성 가이드 v3 압축판

날짜: 2026-06-12

## 목표

원본 코드를 복사하지 않고 같은 full-stack starter를 만든다. 이름과 문구는 달라도 되지만 구조, 인증 경계, SQL-first DB, shared contract, API envelope, FE 품질 루프는 유지한다.

## 금지

- 원본 저장소 소스/설정 복사.
- Vite/Nest/shadcn/TanStack scaffold 파일 수동 작성.
- API CRUD/auth를 배열, Map, singleton store, `board-store.ts`로 구현.
- `synchronize: true`.
- Web -> API/Nest/Node import.
- API -> Web/UI import.
- shared -> React/Nest/Node/DB import.

## CLI 초기화

명령은 `docs/generation/commands.md`에 기록한다.

```bash
npm init -y
mkdir -p apps packages docs/generation docs/ai .codex/skills
npm create vite@latest apps/web-client -- --template react-ts
cd apps && npx @nestjs/cli@latest new api-server --strict --package-manager npm --skip-install --skip-git
```

shadcn/ui와 TanStack Router는 공식 CLI/문서 절차를 쓴다. `packages/ui`에서 shadcn 감지가 실패하면 `apps/web-client`에서 CLI init/add 후 같은 primitive API를 `packages/ui`로 정리하고 fallback을 기록한다.

## 최종 구조

```text
compose.yml
eslint.config.mjs
prettier.config.mjs
package.json
apps/api-server/{.env.example,Dockerfile,database,scripts,src}
apps/web-client/{.env.example,src}
packages/shared
packages/ui
docs/{ai,generation}
.codex/skills
```

## 루트

- npm workspaces: `apps/*`, `packages/*`
- scripts: `dev`, `dev:all`, `dev:web`, `dev:api`, `dev:db`, `dev:db:stop`, `preview:web`, `build`, `build:web`, `build:api`, `typecheck`, `lint`, `format`, `format:check`, `verify`
- `verify = lint && format:check && typecheck && build`
- `dev:api = docker compose --env-file apps/api-server/.env up --build api-server`
- `dev:db = docker compose --env-file apps/api-server/.env up -d postgres`
- Prettier: 4칸, 120자
- ESLint: TS recommended, React Hooks, kebab-case 파일/폴더, 모듈 경계, JSX 안 익명 함수 금지
- Husky/lint-staged 사용

## Compose

루트 `compose.yml` 필수.

- `postgres`: Postgres, required env expansion, healthcheck, named volume
- `api-server`: `apps/api-server/Dockerfile` development target, `apps/api-server/.env`, 루트 mount, node_modules volume

## shared

`packages/shared`는 Zod contract 전용이다.

```text
src/contracts/{api.contract.ts,auth.contract.ts,post.contract.ts}
src/index.ts
```

필수:

- `zod`, `tsup`, ESM/CJS/types export
- envelope: success `{ requestId, data }`, error `{ requestId, error: { code, message } }`
- auth: `USER|ADMIN`, `PENDING|ACTIVE|SUSPENDED`, `User`, complete signup, update me
- board: positive numeric id, post sort/view/query, tag, post, comment, list/create/update/delete schemas
- controller/Web HTTP는 schema로 경계 검증, service는 infer type 사용
- command response는 id만 반환

## ui

`packages/ui`는 shadcn/Radix primitive 전용이다.

```text
components.json
src/components.ts
src/components/{button,input,textarea,select,label,field,card,badge,table,dialog,separator}.tsx
src/lib/utils.ts
src/styles/globals.css
```

- 앱은 `@project/ui/components`만 사용
- `cn`은 UI 내부 util
- UI는 앱/API/shared 도메인을 import하지 않음
- Radix 또는 `radix-ui`, lucide, cva, clsx, tailwind-merge, tw-animate-css 사용

## API 서버

Nest strict app.

필수 deps: Nest core/platform, TypeORM, pg, dotenv, zod, nestjs-pino, pino-http, shared.

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
- CORS는 env web origin + credentials
- request id는 `x-request-id` 재사용 또는 UUID 생성, 응답 header에 기록
- success interceptor와 exception filter로 envelope 강제
- env는 `apps/api-server/.env` 필수, 기본값 없이 Zod parse, `.env.example` 제공
- DB config는 `synchronize: false`, SQL script가 schema 원본

## SQL-first DB

```text
apps/api-server/database/init-db.sql
apps/api-server/database/dummy-data.sql
```

필수 테이블: `user`, `session`, `account`, `verification`, `posts`, `post_tags`, `post_tag_links`, `comments`.

- SQL이 schema/seed 원본
- entity는 SQL mapping과 API 변환 메서드만 담당
- service/module seed 금지
- resource id는 DB auto increment

## auth feature

로그인 방식은 OAuth/ID-password/stub 중 선택 가능하나 user/session 처리는 DB-backed.

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
- guard가 cookie/authorization 세션 검증 후 request에 claims 저장
- controller는 `@CurrentAuth()`만 사용
- pending 허용 guard와 active-only guard 분리, suspended 차단
- role/status 변경 시 DB session 만료/삭제
- auth service는 `InjectRepository(UserEntity)`와 `InjectRepository(SessionEntity)` 사용
- account API: `GET /api/account/me`, `POST /api/account/complete-signup`, `PATCH /api/account/me`

## board feature

```text
board.module.ts
board-errors.ts
controller/{posts.controller.ts,comments.controller.ts,post-tags.controller.ts}
service/{board-query.service.ts,board-command.service.ts}
database/{post.entity.ts,post-tag.entity.ts,post-tag-link.entity.ts,comment.entity.ts,index.ts}
index.ts
```

API: posts list/detail/create/update/delete, comments list/create/update/delete, `GET /api/post-tags`.

- controller는 shared schema로 params/query/body/response parse
- create/update/delete는 active account guard
- query service는 Post/Tag/Link/Comment/User repository를 `InjectRepository`로 주입
- command service는 `InjectDataSource`/`DataSource.transaction()`으로 write
- 작성자 ID만 저장, authorName은 read에서 user table 조회
- 작성자 또는 ADMIN만 수정/삭제

## Web

Vite React TS.

Deps: TanStack Router/plugin/CLI, TanStack Query, ky, nuqs, React Hook Form, Zod resolver, shared, ui.

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

- route 파일은 page 연결과 search 검증만 담당
- `http-client.ts`: ky `/api`, credentials include, shared envelope parse, typed error
- React Query hooks는 feature에 직접 작성
- Suspense는 query pending, ErrorBoundary는 query error, mutation pending은 이벤트 UI
- handler는 `handle*`, JSX 안 익명 함수 금지
- 폼은 RHF + Zod resolver + shared contract
- UI는 `@project/ui/components` 우선

## Codex skills

`.codex/skills` 필수:

- `toss-frontend-fundamentals`
- `vercel-react-best-practices`
- `vercel-composition-patterns`
- `web-design-guidelines`
- `writing-guidelines`

각 skill은 `SKILL.md`를 가진다. 외부 변환 skill은 원본 URL/license/적용 범위를 기록한다.

FE 변경 루프: `npm run verify` -> React Doctor 또는 불가 사유 -> Toss 기준 리뷰 -> Vercel React best practices 리뷰 -> 수정 -> `npm run verify`.

## 자체 검증

실패해야 함:

```bash
rg "board-store|Post\\[\\] =|UserRecord\\[\\]|new Map" apps/api-server/src/features
```

성공해야 함:

```bash
rg "InjectRepository|DataSource" apps/api-server/src/features/board/service
rg "InjectRepository" apps/api-server/src/features/auth/service
rg "synchronize: false" apps/api-server/src
```

필수:

```bash
npm run verify
```

결과는 `docs/generation/result.md`에 기록한다.
