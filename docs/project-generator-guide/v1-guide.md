# 프로젝트 생성 가이드 v1

날짜: 2026-06-12

## 목표

현재 코드베이스를 직접 복사하지 않고, 같은 기능과 구조를 가진 TypeScript full-stack starter를 만든다. 이름, 샘플 문구, 더미 데이터는 달라도 된다. 구조, 경계, 인증 흐름, DB 방식, 검증 루프는 유지한다.

## 금지

- 현재 저장소의 소스 파일을 복사하지 않는다.
- 빌드 설정 파일이나 프레임워크 스캐폴딩 파일을 처음부터 수동 작성하지 않는다.
- Web이 API 서버 코드를 import하지 않는다.
- API 서버가 Web/UI 코드를 import하지 않는다.
- `packages/shared`가 React, Nest, Node 런타임, DB를 import하지 않는다.
- TypeORM `synchronize`를 켜지 않는다.
- DB 스키마 원본을 TypeORM migration/entity로 삼지 않는다.
- 인증 방법을 GitHub OAuth 하나로 고정하지 않는다.

## 초기화 원칙

공식 CLI나 터미널 명령으로 프로젝트를 초기화한다.

- Vite web app: `npm create vite@latest apps/web-client -- --template react-ts`
- Nest API app: `npx @nestjs/cli@latest new api-server --strict --package-manager npm --skip-install --skip-git`
- shadcn/ui: `npx shadcn@latest init` 또는 monorepo 문서의 CLI 흐름
- TanStack Router: 공식 Vite file-based routing 설치 흐름

명령 실행 기록을 `docs/generation/commands.md`에 남긴다.

## 최종 워크스페이스

```text
apps/
  web-client/
  api-server/
packages/
  shared/
  ui/
docs/
  ai/
  generation/
.codex/
  skills/
```

루트는 npm workspaces를 사용한다.

```json
{
    "private": true,
    "workspaces": ["apps/*", "packages/*"]
}
```

## 루트 scripts

루트 `package.json`에 사용자용 script를 둔다.

- `dev`: `dev:all` 실행
- `dev:all`: shared build 후 web과 API를 함께 실행
- `dev:web`: shared build 후 web 개발 서버 실행
- `dev:api`: Docker Compose로 API 서버 실행
- `dev:db`: Docker Compose로 Postgres 백그라운드 실행
- `dev:db:stop`: Postgres 중지
- `preview:web`: shared build 후 web production preview
- `build`: shared, web, api 순서로 build
- `build:web`
- `build:api`
- `typecheck`: shared build가 필요한 의존 순서를 지켜 모든 workspace typecheck
- `lint`
- `format`
- `format:check`
- `verify`: lint, format check, typecheck, build 순서로 실행

## 공통 품질

- TypeScript strict를 사용한다.
- Prettier는 4칸 들여쓰기, 120자 print width를 사용한다.
- ESLint는 다음을 검증한다.
    - TypeScript recommended
    - React Hooks
    - `apps/*`, `packages/*`의 TS/TSX 파일명 kebab-case
    - `src` 하위 폴더명 kebab-case
    - Web/API/shared/UI 모듈 경계
    - JSX 안 익명 함수식 금지
- Husky pre-commit에서 lint-staged와 `npm run verify`를 실행한다.

## packages/shared

목적: 앱 독립 API contract와 순수 도메인 타입.

초기화:

- `packages/shared/package.json`을 workspace package로 만든다.
- `zod`, `tsup`, `typescript`를 사용한다.
- ESM/CJS/types export를 제공한다.
- `build`: `tsup`
- `typecheck`: `tsc -p tsconfig.json --noEmit`

구조:

```text
packages/shared/src/
  contracts/
    api.contract.ts
    auth.contract.ts
    post.contract.ts
  index.ts
```

필수 contract:

- API error payload: `code`, `message`
- API error response: `requestId`, `error`
- success response schema factory: `requestId`, `data`
- user role: `USER`, `ADMIN`
- user status: `PENDING`, `ACTIVE`, `SUSPENDED`
- user: `id`, `email`, `name`, `image`, `role`, `status`, `createdAt`
- complete signup request/response
- update current user request/response
- numeric positive resource id schema
- post sort/view query
- post tag
- post
- list posts query/response
- create/update/delete post request/response
- comment list/create/update/delete request/response

규칙:

- schema와 type을 함께 export한다.
- request/response 객체 원본은 shared contract다.
- service 계층은 schema 값 대신 type을 사용한다.

## packages/ui

목적: 앱 독립 reusable UI primitive.

초기화:

- shadcn/ui CLI를 사용한다.
- monorepo에서 UI 패키지를 CLI 대상 위치로 둔다.
- Radix, lucide-react, class-variance-authority, clsx, tailwind-merge를 사용한다.

구조:

```text
packages/ui/src/
  components/
  lib/
  styles/
  components.ts
```

필수 primitive:

- button
- input
- textarea
- select
- label
- field
- card
- badge
- table
- dialog
- separator

규칙:

- 앱은 `@project/ui/components`에서 primitive를 import한다.
- `cn`은 UI 패키지 내부 util로만 둔다.
- UI 패키지는 앱 도메인, API 서버, shared contract를 import하지 않는다.

## apps/api-server

목적: Nest 기반 HTTP API.

초기화:

- Nest CLI로 `apps/api-server`를 만든다.
- workspace package 이름을 지정한다.
- `@project/shared`를 workspace dependency로 추가한다.
- `@nestjs/typeorm`, `typeorm`, `pg`, `dotenv`, `zod`, `nestjs-pino`, `pino-http`를 추가한다.

구조:

```text
apps/api-server/src/
  main.ts
  app.module.ts
  app-errors.ts
  core/
    assert.ts
  infra/
    env/
    database/
    http/
  features/
    auth/
    health/
    board/
```

### main

- Nest app을 만든다.
- CORS origin은 env의 web origin을 사용하고 credentials를 켠다.
- provider auth handler가 있으면 `/api/auth/*`에 mount한다.
- JSON/urlencoded body parser를 켠다.
- global prefix는 `api`다.
- global exception filter와 response interceptor를 등록한다.
- env port로 listen한다.

### app module

- `nestjs-pino` logger를 등록한다.
- request id key를 `requestId`로 맞춘다.
- `DatabaseModule`, `AuthModule`, `BoardModule`, `HealthModule`을 import한다.

### env

- API 서버 env 파일은 `apps/api-server/.env`다.
- 없으면 시작 실패한다.
- 기본값 없이 Zod로 파싱한다.
- `.env.example`에 필요한 키를 모두 둔다.
- 필수 키:
    - `NODE_ENV`
    - `PORT`
    - `PROJECT_API_ORIGIN`
    - `PROJECT_WEB_ORIGIN`
    - DB host, port, username, password, database, logging, manual initialization
    - auth secret, signup redirect path, error redirect path, cookie secure
    - 선택 provider에 필요한 OAuth 또는 password auth env

### http infra

- request id는 `x-request-id`가 있으면 재사용하고 없으면 UUID를 만든다.
- success interceptor는 controller 반환값을 `{ requestId, data }`로 감싼다.
- exception filter는 domain error, Zod validation error, HTTP exception, unknown error를 `{ requestId, error: { code, message } }`로 변환한다.

### app errors

- `DomainError`는 `statusCode`, `code`, `message`를 가진다.
- 전역 error 파일에는 범용 타입과 생성 함수만 둔다.
- 도메인별 error 정의는 각 feature 내부에 둔다.

## 인증 feature

목적: 로그인 방식과 무관한 세션 기반 사용자 경계.

구조:

```text
features/auth/
  auth.module.ts
  auth.model.ts
  auth.env.ts
  auth-errors.ts
  controller/
  service/
  database/
  index.ts
```

필수 모델:

- `AuthClaims`: `userId`, `sessionId`, `role`, `status`
- `UserRecord`: shared `User`와 같은 의미

필수 controller/helper:

- `SessionUserGuard`: 로그인 세션 필요, pending 허용 가능
- `ActiveAccountGuard`: active 계정만 허용
- `CurrentAuth` decorator
- `toAuthRequestContext`: request의 authorization/cookie를 guard 입력으로 변환

규칙:

- controller method는 cookie/header를 직접 읽지 않는다.
- guard가 세션을 검증하고 request에 claims를 저장한다.
- controller는 `@CurrentAuth()`만 사용한다.
- pending 사용자는 signup 완료 API만 접근할 수 있다.
- suspended 사용자는 차단한다.
- role/status 변경 시 기존 세션을 만료한다.

provider adapter:

- 구체 provider는 교체 가능해야 한다.
- OAuth를 쓰면 provider callback 라우트는 provider handler에 맡길 수 있다.
- ID/password를 쓰면 같은 세션 store와 claims 변환 규칙을 사용한다.
- 어떤 방식을 쓰든 앱 API의 사용자 처리는 `AuthClaims`로 통일한다.

필수 account API:

- `GET /api/account/me`
- `POST /api/account/complete-signup`
- `PATCH /api/account/me`

## DB

목적: SQL-first Postgres schema.

구조:

```text
apps/api-server/database/
  init-db.sql
  dummy-data.sql
```

규칙:

- `init-db.sql`이 schema 원본이다.
- `dummy-data.sql`은 개발 데이터만 넣는다.
- TypeORM entity는 SQL schema를 반영한다.
- `synchronize: false`를 고정한다.
- entity에는 DB 값 정규화와 API 객체 변환 메서드를 둔다.
- DB seed를 service/module에서 수행하지 않는다.

필수 테이블:

- user/session/account/verification 또는 선택 auth provider가 요구하는 동등 테이블
- posts
- post_tags
- post_tag_links
- comments

## board feature

목적: starter가 실제 개발 가능한지 보여주는 샘플 CRUD.

구조:

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

규칙:

- controller는 shared schema로 query/body/params/response를 파싱한다.
- 생성/수정/삭제는 active account guard를 사용한다.
- 작성자 권한은 작성자 본인 또는 ADMIN만 허용한다.
- 생성 리소스는 작성자 ID만 저장한다.
- 응답에 작성자 이름이 필요하면 query service가 user 데이터를 조회해 붙인다.
- command response는 id만 반환한다.

## apps/web-client

목적: Vite React SPA.

초기화:

- Vite React TypeScript template로 만든다.
- TanStack Router Vite plugin과 CLI를 설치한다.
- TanStack Query, ky, nuqs, React Hook Form, Zod resolver, better-auth client 또는 선택 auth client를 설치한다.
- `@project/shared`, `@project/ui`를 workspace dependency로 추가한다.
- Tailwind와 shadcn/ui 스타일을 연결한다.

구조:

```text
apps/web-client/src/
  main.tsx
  index.css
  app/
    providers/
    root/
    router.tsx
  routes/
  pages/
  features/
    auth/
    posts/
  shared/
    api/
    env/
```

### app

- `main.tsx`는 React root 생성만 담당한다.
- `app/router.tsx`는 route tree와 router 생성만 담당한다.
- `app/providers`는 QueryClientProvider 등 전역 provider만 둔다.
- root route는 header, pending fallback, error fallback을 연결한다.

### routes

- TanStack Router file routes를 사용한다.
- routes 파일은 page component 연결과 search schema 검증만 담당한다.
- 필수 route:
    - `/`
    - `/posts`
    - `/posts/new`
    - `/posts/$postId`
    - `/posts/$postId/edit`
    - `/me`
    - `/auth/complete-signup`
    - `/auth/error`

### shared api

- ky instance를 만든다.
- prefix는 `/api`다.
- credentials는 include다.
- success envelope를 shared schema로 파싱하고 `data`만 반환한다.
- HTTP error는 shared error envelope를 파싱해 typed error로 던진다.

### auth feature

- auth provider client는 feature 내부에 둔다.
- current user query, logout mutation, update current user mutation을 둔다.
- user status predicate를 model에 둔다.
- pending user는 complete signup 페이지로 유도한다.

### posts feature

구조:

```text
features/posts/
  api/
  hooks/
  model/
  ui/
  index.ts
```

필수:

- typed post API 함수
- React Query hooks
- URL search state hook
- permission predicate
- post form
- post table
- post cards
- tag badges
- comments UI

규칙:

- API 객체 원본은 shared contract를 사용한다.
- event handler는 `handle*` 이름으로 분리한다.
- JSX 안에서 익명 함수를 만들지 않는다.
- query pending은 Suspense fallback에 맡긴다.
- error는 ErrorBoundary에 맡긴다.
- mutation pending은 버튼/폼 UI에서 직접 표현한다.

## Codex skill 관리

구조:

```text
.codex/skills/
  toss-frontend-fundamentals/
  vercel-react-best-practices/
  vercel-composition-patterns/
  web-design-guidelines/
  writing-guidelines/
```

규칙:

- skill은 `SKILL.md`를 필수로 가진다.
- 외부 agent skill을 가져오면 Codex skill 형식으로 변환한다.
- 원본 URL, license, 적용 범위를 frontmatter 또는 본문에 남긴다.
- `SKILL.md`는 짧게 유지하고 상세 규칙은 `references/`로 분리한다.
- FE 코드 작성/리팩터링 후 다음 루프를 수행한다.
    1. `npm run verify`
    2. React Doctor 진단
    3. Toss 기준 리뷰: 가독성, 예측 가능성, 응집도, 결합도
    4. Vercel React best practices 리뷰: waterfall, bundle, rerender, rendering
    5. 수정 후 다시 `npm run verify`

## 문서

- `docs/project-standards.md`에 프로젝트 표준을 둔다.
- `docs/ai`에 의미 있는 AI 작업 기록을 남긴다.
- AI 기록은 이유, 작업, 결과를 포함한다.
- 현재 커밋을 가리킬 때는 해시 대신 `이 메모가 포함된 커밋`이라고 쓴다.

## 생성 후 검증

필수:

```bash
npm run verify
```

가능하면 추가 확인:

```bash
npm run dev:db
npm run dev:api
curl http://localhost:3000/api/health
curl http://localhost:3000/api/posts
npm run preview:web
```

검증 결과를 `docs/generation/result.md`에 기록한다.
