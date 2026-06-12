# 프로젝트 생성 가이드 v2

날짜: 2026-06-12

## 목표

현재 코드베이스를 직접 복사하지 않고, 같은 기능과 구조를 가진 TypeScript full-stack starter를 만든다. 이름과 샘플 문구는 달라도 되지만, 파일 위치, 모듈 경계, 인증 경계, SQL-first DB, API envelope, FE 품질 루프는 재현한다.

## 핵심 합격 조건

- `npm run verify`가 통과한다.
- 루트에 `compose.yml`이 있다.
- `apps/api-server/database/init-db.sql`이 DB schema 원본이다.
- TypeORM `synchronize`는 항상 `false`다.
- 게시글/댓글/태그/account API는 in-memory store가 아니라 TypeORM repository 또는 DataSource로 DB를 사용한다.
- 인증 방법은 강제하지 않지만 세션 기반 `AuthClaims` 흐름은 필수다.
- Web은 API 서버 코드를 import하지 않고 HTTP client만 사용한다.
- `packages/shared`의 Zod schema가 request/response contract 원본이다.
- `.codex/skills`에 FE 품질 개선용 Codex skill을 둔다.

## 금지

- 원본 저장소 소스 파일 복사.
- 빌드 설정과 프레임워크 scaffold 파일을 처음부터 수동 작성.
- API CRUD를 배열, Map, singleton store, `board-store.ts`로 구현.
- auth user/session을 배열이나 Map으로 구현.
- TypeORM migration/entity를 DB schema 원본으로 삼기.
- `synchronize: true`.
- Web에서 API 서버, Nest, Node 런타임 import.
- API 서버에서 Web/UI import.
- `packages/shared`에서 React, Nest, Node, DB import.

## 공식 CLI 초기화

빈 디렉터리에서 시작한다. 실행한 명령은 `docs/generation/commands.md`에 기록한다.

```bash
npm init -y
mkdir -p apps packages docs/generation docs/ai .codex/skills
npm create vite@latest apps/web-client -- --template react-ts
cd apps
npx @nestjs/cli@latest new api-server --strict --package-manager npm --skip-install --skip-git
cd ..
```

shadcn/ui는 CLI를 사용한다. `packages/ui`에서 framework 감지가 실패하면 `apps/web-client`에서 CLI init/add를 먼저 수행한 뒤 같은 primitive API를 `packages/ui`에 정리한다. 실패 사실과 fallback을 `docs/generation/commands.md`에 남긴다.

TanStack Router는 공식 Vite file-based routing 설치 절차를 따른다.

## 최종 트리

```text
compose.yml
eslint.config.mjs
prettier.config.mjs
package.json
apps/
  api-server/
    .env.example
    Dockerfile
    database/
      init-db.sql
      dummy-data.sql
    scripts/
      dev-entrypoint.sh
    src/
      main.ts
      app.module.ts
      app-errors.ts
      core/
      infra/
      features/
  web-client/
    .env.example
    src/
      app/
      routes/
      pages/
      features/
      shared/
packages/
  shared/
  ui/
docs/
  ai/
  generation/
.codex/
  skills/
```

## 루트 package

- npm workspaces: `apps/*`, `packages/*`
- root script:
    - `dev`: `dev:all`
    - `dev:all`: shared build 후 web과 API 동시 실행
    - `dev:web`: shared build 후 web dev
    - `dev:api`: `docker compose --env-file apps/api-server/.env up --build api-server`
    - `dev:db`: `docker compose --env-file apps/api-server/.env up -d postgres`
    - `dev:db:stop`: `docker compose --env-file apps/api-server/.env stop postgres`
    - `preview:web`: shared build 후 web production preview
    - `build`: shared, web, api 순서
    - `build:web`
    - `build:api`
    - `typecheck`: shared build, ui typecheck, web typecheck, api typecheck
    - `lint`: `eslint . --max-warnings=0`
    - `format`
    - `format:check`
    - `verify`: lint, format check, typecheck, build
- Husky/lint-staged를 둔다.
- Prettier: 4칸, 120자.
- ESLint:
    - TypeScript recommended
    - React Hooks
    - 파일/폴더 kebab-case
    - 모듈 경계
    - JSX 안 익명 함수식 금지

## Docker Compose

루트 `compose.yml`은 필수다.

- `postgres`: Postgres, env required expansion, healthcheck, named volume.
- `api-server`: `apps/api-server/Dockerfile`의 development target 사용, `apps/api-server/.env` env file 사용, 루트 workspace mount, node_modules volume.
- API 서버 실행은 루트 `dev:api`만 공식 경로다.

## packages/shared

역할: Zod 기반 API contract와 순수 타입.

필수 파일:

```text
packages/shared/src/contracts/api.contract.ts
packages/shared/src/contracts/auth.contract.ts
packages/shared/src/contracts/post.contract.ts
packages/shared/src/index.ts
```

필수:

- `zod` dependency.
- `tsup` build.
- ESM/CJS/types export.
- success envelope schema factory: `{ requestId, data }`
- error envelope schema: `{ requestId, error: { code, message } }`
- `UserRole`: `USER`, `ADMIN`
- `UserStatus`: `PENDING`, `ACTIVE`, `SUSPENDED`
- `User`: string `id`, `email`, nullable `name`, nullable `image`, `role`, `status`, `createdAt`
- account request/response: complete signup, update current user
- resource id: positive integer
- posts query: `q`, `tagId`, `page`, `pageSize`, `sort`, `view`
- post/tag/comment schemas and list/create/update/delete response schemas

규칙:

- controller와 Web HTTP 함수는 schema로 경계 검증.
- service는 schema 값이 아니라 infer type을 사용.
- command response는 전체 리소스 대신 id만 반환.

## packages/ui

역할: 앱 독립 shadcn/Radix 기반 primitive.

필수 파일:

```text
packages/ui/components.json
packages/ui/src/components.ts
packages/ui/src/lib/utils.ts
packages/ui/src/styles/globals.css
packages/ui/src/components/
```

필수 primitive:

- button, input, textarea, select, label, field, card, badge, table, dialog, separator

규칙:

- 앱은 `@project/ui/components`에서 import.
- `cn`은 UI 패키지 내부 util.
- UI 패키지는 앱/API/shared 도메인을 import하지 않음.
- `radix-ui`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`를 사용.

## apps/api-server

Nest strict app이다.

필수 dependency:

- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`
- `@nestjs/typeorm`, `typeorm`, `pg`
- `dotenv`, `zod`
- `nestjs-pino`, `pino-http`
- `@project/shared`

필수 구조:

```text
src/
  main.ts
  app.module.ts
  app-errors.ts
  core/assert.ts
  infra/
    env/
      env-file.ts
      server-env.ts
      index.ts
    database/
      database.config.ts
      database.module.ts
      index.ts
    http/
      api-response.ts
      api-response.interceptor.ts
      api-exception.filter.ts
      index.ts
  features/
    auth/
    board/
    health/
```

### API envelope

- request id는 `x-request-id`가 있으면 재사용하고 없으면 UUID.
- response header에 `x-request-id`를 둔다.
- success interceptor: `{ requestId, data }`
- exception filter:
    - `DomainError`
    - Zod validation error
    - Nest `HttpException`
    - unknown error
- error response: `{ requestId, error: { code, message } }`

### Env

- API env 파일은 `apps/api-server/.env`.
- 없으면 서버 시작 실패.
- 기본값 없이 Zod로 파싱.
- `.env.example` 필수.
- Web env 파일은 `apps/web-client/.env.example`.

### Database

- `database.config.ts`에서 `synchronize: false`.
- `autoLoadEntities: true`를 사용할 수 있다.
- `manualInitialization`, logging 등 env를 반영한다.
- DB schema 생성은 SQL script만 담당한다.

## SQL-first DB

필수 SQL:

- `apps/api-server/database/init-db.sql`
- `apps/api-server/database/dummy-data.sql`

필수 테이블:

- `user`
- `session`
- `account`
- `verification`
- `posts`
- `post_tags`
- `post_tag_links`
- `comments`

규칙:

- SQL script가 schema 원본.
- TypeORM entity는 SQL과 맞춘 mapping.
- seed/dummy data는 SQL에서만 수행.
- service/module에서 seed하지 않는다.
- 게시글/댓글/태그 API는 SQL 테이블을 실제로 읽고 쓴다.

## 인증 feature

로그인 방식은 선택 가능하다. 그래도 user/session 저장과 current user 처리는 DB-backed여야 한다.

필수 구조:

```text
features/auth/
  auth.module.ts
  auth.model.ts
  auth.env.ts
  auth-errors.ts
  controller/
    auth-request.ts
    current-auth.decorator.ts
    session-user.guard.ts
    active-account.guard.ts
    auth.controller.ts
  service/
    auth-query.service.ts
    auth-command.service.ts
  database/
    user.entity.ts
    session.entity.ts
    account.entity.ts
    verification.entity.ts
    index.ts
  index.ts
```

필수 모델:

- `AuthClaims`: `userId`, `sessionId`, `role`, `status`
- `UserRecord`: shared `User`와 같은 의미

규칙:

- guard가 cookie/authorization에서 세션을 검증한다.
- controller는 cookie/header를 직접 읽지 않고 `@CurrentAuth()`만 받는다.
- pending 허용 guard와 active-only guard를 구분한다.
- suspended는 차단.
- role/status 변경 시 기존 session을 DB에서 만료/삭제한다.
- `auth-query.service.ts`는 세션 조회와 current user 조회.
- `auth-command.service.ts`는 complete signup, current user update, 세션 만료.
- auth service는 `InjectRepository(UserEntity)`와 `InjectRepository(SessionEntity)`를 사용한다.
- auth provider adapter는 OAuth 또는 ID/password 중 하나로 얇게 구현하거나 stub으로 둘 수 있지만, user/session 저장은 DB-backed여야 한다.

필수 account API:

- `GET /api/account/me`
- `POST /api/account/complete-signup`
- `PATCH /api/account/me`

## board feature

필수 구조:

```text
features/board/
  board.module.ts
  board-errors.ts
  controller/
    posts.controller.ts
    comments.controller.ts
    post-tags.controller.ts
  service/
    board-query.service.ts
    board-command.service.ts
  database/
    post.entity.ts
    post-tag.entity.ts
    post-tag-link.entity.ts
    comment.entity.ts
    index.ts
  index.ts
```

필수 API:

- `GET /api/posts`
- `GET /api/posts/:postId`
- `POST /api/posts`
- `PATCH /api/posts/:postId`
- `DELETE /api/posts/:postId`
- `GET /api/posts/:postId/comments`
- `POST /api/posts/:postId/comments`
- `PATCH /api/posts/:postId/comments/:commentId`
- `DELETE /api/posts/:postId/comments/:commentId`
- `GET /api/post-tags`

필수 DB-backed 구현:

- `board-query.service.ts`는 `InjectRepository`로 Post, Tag, Link, Comment, User repository를 주입받는다.
- `board-command.service.ts`는 `InjectDataSource` 또는 `DataSource` transaction을 사용한다.
- 생성/수정/삭제는 TypeORM repository/DataSource로 수행한다.
- 배열, Map, `board-store.ts` 금지.
- 작성자 ID만 저장하고 authorName은 read service에서 user table을 조회해 만든다.
- resource id는 DB bigint/identity/serial auto increment.
- URL param 경계에서만 string을 number로 파싱.
- controller는 shared schema로 params/query/body/response를 파싱한다.

## apps/web-client

Vite React TypeScript app이다.

필수 dependency:

- `@tanstack/react-router`, `@tanstack/router-plugin`, `@tanstack/router-cli`
- `@tanstack/react-query`
- `ky`
- `nuqs`
- `react-hook-form`, `@hookform/resolvers`
- `@project/shared`, `@project/ui`

필수 구조:

```text
src/
  main.tsx
  index.css
  app/
    providers/query-provider.tsx
    providers/app-error-boundary.tsx
    root/header.tsx
    root/route-pending.tsx
    root/route-error-fallback.tsx
    router.tsx
  routes/
  pages/
    auth/
    posts/
  features/
    auth/
      api/
      model/
      index.ts
    posts/
      api/
      hooks/
      model/
      ui/
      index.ts
  shared/
    api/http-client.ts
    env/client-env.ts
```

### Web API

- `shared/api/http-client.ts`가 ky instance를 만든다.
- prefix는 `/api`.
- credentials는 `include`.
- shared success/error envelope를 파싱한다.
- typed error class를 둔다.

### Routes

TanStack file routes:

- `/`
- `/posts`
- `/posts/new`
- `/posts/$postId`
- `/posts/$postId/edit`
- `/me`
- `/auth/complete-signup`
- `/auth/error`

routes 파일은 page 연결과 search 검증만 담당한다.

### FE 구현 규칙

- query pending은 Suspense fallback.
- query error는 ErrorBoundary.
- mutation pending은 이벤트 UI.
- event handler는 `handle*` 이름.
- JSX 안 익명 함수식 금지.
- feature public API는 `index.ts`.
- 폼은 React Hook Form, Zod resolver, shared contract를 우선 사용.
- UI primitive는 `@project/ui/components` 우선.

## Codex skill 관리

필수 skill:

- `toss-frontend-fundamentals`
- `vercel-react-best-practices`
- `vercel-composition-patterns`
- `web-design-guidelines`
- `writing-guidelines`

각 skill은 `SKILL.md`를 가진다. 외부 자료를 변환한 skill은 원본 URL, license, 적용 범위를 남긴다.

FE 변경 루프:

1. `npm run verify`
2. React Doctor 진단 또는 실행 불가 사유 기록
3. Toss 기준 리뷰: 가독성, 예측 가능성, 응집도, 결합도
4. Vercel React best practices 리뷰: waterfall, bundle, rerender, rendering
5. 수정 후 다시 `npm run verify`

## 생성 후 자체 점검

다음 grep은 실패해야 한다.

```bash
rg "board-store|Post\\[\\] =|UserRecord\\[\\]|new Map" apps/api-server/src/features
```

다음 grep은 결과가 있어야 한다.

```bash
rg "InjectRepository|DataSource" apps/api-server/src/features/board/service
rg "InjectRepository" apps/api-server/src/features/auth/service
```

필수 검증:

```bash
npm run verify
```

가능하면 추가 검증:

```bash
npm run dev:db
npm run dev:api
curl http://localhost:3000/api/health
curl http://localhost:3000/api/posts
npm run preview:web
```

검증 결과와 미구현 사항은 `docs/generation/result.md`에 기록한다.
