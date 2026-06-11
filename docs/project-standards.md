# 프로젝트 표준

기준: https://github.com/alan2207/bulletproof-react/blob/master/docs/project-standards.md

## 검증

- 전체 검증: `npm run verify`
- lint: `npm run lint`
- format: `npm run format:check`
- 타입 검증: `npm run typecheck`
- 빌드 검증: `npm run build`
- commit 전 검증: Husky `pre-commit`에서 `lint-staged`와 `npm run verify`
- `lint-staged`: 커밋에 포함된 파일만 Prettier/ESLint 자동 수정을 적용한다.

## NPM scripts

- 사용자가 실행하는 작업은 루트 `package.json` script로 제공한다.
- workspace script는 루트 script가 호출하는 내부 도구 명령으로만 둔다.
- 최적화보다 실행 순서와 대상이 바로 보이는 명령을 우선한다.
- `npm run dev`와 `npm run dev:all`은 웹과 API 서버를 함께 실행한다.
- `npm run dev:web`은 웹 개발 서버만 실행한다.
- React DevTools로 production 조건 렌더링과 Profiler를 확인할 때는 `npm run preview:web`을 사용한다.
- `npm run dev:api`는 API 서버만 실행하며 Postgres를 자동으로 시작하지 않는다.
- 로컬 Postgres는 `npm run dev:db`로 백그라운드 시작하고 `npm run dev:db:stop`으로 중지한다.

## 공통 규칙

- ESLint가 코드 규칙과 파일/폴더명을 검증한다.
- ESLint가 React Hooks 규칙을 검증한다.
- Prettier가 포맷을 검증하며 들여쓰기는 4칸, 줄바꿈 기준은 120자다.
- TypeScript가 타입을 검증한다.
- `apps/*`, `packages/*`의 TS/TSX 파일과 `src` 하위 폴더명은 kebab-case다.
- `*.contract.ts`, `*.config.ts` 같은 중간 확장자는 허용한다.
- TanStack Router 라우트 파일은 프레임워크/생성기 규칙을 따른다.
- 앱 내부 absolute import는 `@/*`를 쓴다.
- workspace 간 import는 패키지 이름으로 한다.

## UI

- `packages/ui`는 앱 독립 reusable UI primitive 패키지다.
- `packages/ui`에는 shadcn 기반 primitive와 직접 작성한 primitive를 둘 수 있다.
- shadcn/ui CLI 대상은 `packages/ui`다.
- `packages/ui/components.json`은 shadcn CLI 설정으로 유지한다.
- `packages/ui/src/components`는 앱 라우팅, feature, API, 도메인 코드를 import하지 않는다.
- 앱은 `@nmm/ui/components`에서 필요한 UI primitive를 import하고, 앱별 조합은 feature/page 코드에서 처리한다.
- 작은 버튼, 링크형 액션, 상태 배지, fallback 패널도 `@nmm/ui/components` primitive를 우선 사용한다.
- HTML tag를 직접 작성하기 전에 `@nmm/ui/components` 또는 shadcn/ui primitive로 대체 가능한지 확인한다.
- 대체 가능한 primitive가 있으면 raw HTML 대신 `@nmm/ui/components`를 사용한다.
- 필요한 primitive가 없고 재사용 가치가 있으면 feature/page에 임시 조합을 만들기 전에 `packages/ui`에 추가할지 검토한다.
- 일반 본문 링크, 의미 태그, 단순 레이아웃은 shadcn 대체 가능성을 확인한 뒤 직접 HTML과 Tailwind utility를 사용할 수 있다.
- `cn`은 `packages/ui/src/lib/utils.ts`에만 두며 앱 코드에서 import하지 않는다.
- web의 CSS entry는 `@nmm/ui/styles/globals.css`와 UI 패키지 Tailwind source만 연결한다.
- `packages/ui/src/styles/globals.css`는 shadcn 기본 scaffold만 유지한다.
- 색상 변경은 shadcn이 제공하는 `tailwind.baseColor` 범주를 `packages/ui/components.json`에서 고르는 방식만 허용한다.
- 앱별 CSS 파일, 직접 CSS selector, 직접 theme token 추가/수정은 금지한다.
- `section`, `main`, `form`, `h1`, `p`, `div` 같은 의미/레이아웃 태그와 Tailwind layout utility는 허용한다.
- 버튼, 입력, 카드, 표, 선택 UI 같은 primitive는 `@nmm/ui/components`를 우선 사용한다.

## Frontend 구조

- `app`은 앱 시작, 전역 provider, root route 전용 코드만 담당한다.
- `app/providers`는 전역 provider만 둔다.
- `app/root`는 `routes/__root.tsx`에 붙는 header, route fallback, pending 같은 root route 전용 UI만 둔다.
- `routes`는 TanStack Router 파일 라우팅과 search 검증 연결만 담당한다.
- `pages`는 라우트에 붙는 화면 조립 단위다.
- `features/<domain>`은 `api`, `model`, `hooks`, `ui`, `lib`, `index.ts` 구조를 우선 사용한다.
- `features/<domain>/ui`는 해당 feature 전용 UI 조합만 둔다.
- feature `index.ts`는 page에서 써도 되는 공개 API만 export한다.
- 조회 pending은 Suspense fallback에 위임한다.
- 조회 error는 가장 가까운 ErrorBoundary가 잡고, 영역별 대체 UI가 필요하면 더 좁은 boundary를 둔다.
- 현재는 루트 라우트 범위의 넓은 `AppErrorBoundary`만 둔다.
- mutation pending은 이벤트 UI에서 직접 다루고, mutation error UX는 이후 요구사항이 생기면 정한다.
- JSX 안에서는 익명 함수식을 직접 만들지 않는다. prop과 render-function children은 이름 있는 함수로 전달한다.
- JSX 밖의 `map`, `useMemo` 같은 순수 계산 콜백은 인라인으로 둘 수 있다.
- 성공/실패/이벤트처럼 특정 상황의 동작을 담는 콜백은 가능하면 `handle*` 이름의 함수로 분리한다.

## API 계약

- API 요청/응답 계약 원본은 `packages/shared/src/contracts/*.contract.ts`의 Zod schema다.
- API 서버 controller는 외부 요청과 응답을 shared Zod schema로 파싱한다.
- API 서버 service는 shared contract type만 사용하고 Zod schema 값을 import하지 않는다.
- Web은 shared Zod schema로 표준 응답 envelope를 파싱하는 수동 typed HTTP 함수를 쓴다.
- OpenAPI/Orval/generated client는 기본 API 공유 방식으로 쓰지 않는다.
- Web feature 코드는 API 객체 형식 원본으로 shared contract를 우선 사용한다.
- API server controller와 Web HTTP 함수는 request/response contract type을 명시하고, schema는 경계 검증에 쓴다.
- 전처리가 필요한 값은 raw 인자와 전처리된 변수를 분리해서 명명한다.
- TanStack Query hook은 feature 코드에서 직접 작성한다.
- API 계약이 바뀌면 shared contract, API 서버 controller 파싱, Web HTTP 함수를 같은 작업 단위로 갱신한다.
- JSON 성공 응답은 `{ requestId, data }`, JSON 에러 응답은 `{ requestId, error: { code, message } }`를 쓴다.
- Command API 응답은 전체 리소스 데이터를 반환하지 않고 API별 필수 식별자를 포함한다. 추가 상태는 필요할 때만 둔다.
- `/api/auth/*`는 Better Auth가 처리하며 표준 응답 envelope를 강제하지 않는다.
- 앱 전용 인증 API는 `/api/account/*`에 두고 shared contract와 표준 envelope를 쓴다.
- API 서버 전역 에러 코드는 `app-errors.ts`에 `DomainError` 타입과 생성 함수만 둔다.
- 도메인별 에러 code/message/status는 해당 feature 내부에 두고 feature index로 export하지 않는다.
- 전역 exception filter는 `DomainError`를 `{ requestId, error: { code, message } }`로 변환한다.
- API 서버 env 파일은 `apps/api-server/.env`로 고정하고, 없으면 서버 시작이 실패한다.
- env 값은 기본값 없이 `apps/api-server/.env`에서 읽어 `serverEnv` 전역 객체로 생성한다.
- Docker Compose는 `npm run dev:api`의 `--env-file apps/api-server/.env`로 env 값을 주입한다.
- 필요한 env 키는 `apps/api-server/.env.example`에 둔다.
- Web env 파일은 `apps/web-client/.env`로 두고 필요한 키는 `apps/web-client/.env.example`에 둔다.
- API 서버 DB 스키마는 `apps/api-server/database/init-db.sql`에 둔다.
- API 서버 더미 데이터는 `apps/api-server/database/dummy-data.sql`에 둔다.
- TypeORM `synchronize`는 사용하지 않는다.
- service/module은 DB seed를 수행하지 않는다.
- API 서버 인증은 Better Auth social provider와 TypeORM adapter를 기준으로 한다.
- 인증이 필요한 controller method는 guard가 세션을 검증하고 `@CurrentAuth()`로 `AuthClaims`를 받는다.
- 활성 계정만 허용하는 controller method는 `ActiveAccountGuard`와 `@CurrentAuth()`로 `AuthClaims`를 받는다.
- controller는 인증 헤더/cookie를 직접 읽지 않는다.
- 인증 guard는 세션에서 `AuthClaims`만 request에 둔다.
- `AuthClaims`는 `userId`, `sessionId`, `role`, `status`만 포함한다.
- 생성 리소스는 작성자 ID만 저장한다.
- 작성자 이름이 필요한 응답은 read service가 사용자 데이터를 조회해 만든다.
- 사용자 `role` 또는 `status` 변경은 service가 해당 사용자의 기존 세션을 만료한다.
- 게시글/댓글/태그처럼 생성되는 리소스 ID는 DB `bigint` auto-increment를 사용하고 앱 코드에서 직접 만들지 않는다.
- API 요청/응답의 ID는 숫자로 다루고, URL 파라미터 경계에서만 문자열을 숫자로 파싱한다.
- API 서버 feature는 `controller`, `service`, `database`를 우선 사용하고 `domain` 레이어를 두지 않는다.
- TypeORM entity는 `database`에 둔다.
- TypeORM entity의 DB 값 정규화와 API 객체 변환은 entity의 `from`, `to*` 메서드에 둔다.
- service는 TypeORM repository/DataSource를 직접 주입받아 DB를 다룬다.
- service는 다른 service를 주입하지 않는다. 여러 service가 같은 데이터가 필요하면 같은 repository/DataSource를 각자 주입한다.
- service method는 외부에서 호출되는 API만 public으로 두고, 내부에서만 쓰는 method는 private으로 둔다.
- 단순 조회/가공 helper는 가능하면 별도 method로 빼지 않고 호출 method 안에 둔다.
- read service method는 필요한 데이터를 먼저 조회하고, `map`/`filter`를 쓸 때도 중간 변수에 이름을 붙여 가공한 뒤 반환한다.
- 당연히 성립해야 하는 전처리 조건은 `ASSERT_VERIFY`, `ASSERT_WARN`, `ASSERT_THROW`, `ASSERT_MUST`를 의도에 맞게 쓰고, 입력은 조건과 설명만 둔다.
- repository interface와 구현체 레이어는 두지 않는다.
- service는 query(read only)와 command(변경 목적)를 파일 단위로 분리한다.
- API 서버 공통 순수 코드는 `core`, 전역 인프라/프레임워크 코드는 `infra`에 둔다.

## TypeScript 설정

기준: https://www.totaltypescript.com/tsconfig-cheat-sheet

- 공통 strict/base 옵션은 `tsconfig.base.json`에 둔다.
- Vite web과 shared는 `module: "preserve"`와 `noEmit: true`를 쓴다.
- Nest API는 tsc 출력이 필요하므로 `module: "NodeNext"`, `outDir`, `sourceMap`, `declaration`을 쓴다.
- Nest API는 현재 CJS 출력 호환을 위해 `verbatimModuleSyntax: false`를 유지한다.

## 모듈 규칙

| 모듈              | 허용                                                    | 금지                                              |
| ----------------- | ------------------------------------------------------- | ------------------------------------------------- |
| `apps/web-client` | React, Vite, `@nmm/shared`, `@nmm/ui`, 내부 상대 import | `apps/api-server`, Nest, Node 런타임, UI 내부 lib |
| `apps/api-server` | Nest, Node 런타임, `@nmm/shared`, 내부 상대 import      | Web/UI, React, Vite                               |
| `packages/shared` | `zod`, 내부 상대 import                                 | 앱 코드, UI, React, Nest, Node 런타임, DB         |
| `packages/ui`     | React, shadcn/ui 의존성, package imports                | Web/API/shared 도메인 코드, Nest, Node 런타임     |

## 구현 위치

- ESLint: `eslint.config.mjs`
- Prettier: `prettier.config.mjs`, `.prettierignore`
- Husky/lint-staged: `.husky/pre-commit`, 루트 `package.json`
- 실행 연결: 루트 `package.json`의 `lint`, `format:check`, `typecheck`, `build`, `verify`
