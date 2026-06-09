# 프로젝트 표준

기준: https://github.com/alan2207/bulletproof-react/blob/master/docs/project-standards.md

## 검증

- 전체 검증: `npm run verify`
- lint: `npm run lint`
- format: `npm run format:check`
- 타입 검증: `npm run typecheck`
- 빌드 검증: `npm run build`
- API 계약 생성: `npm run openapi:generate`
- commit 전 검증: Husky `pre-commit`에서 `lint-staged`와 `npm run verify`
- `lint-staged`: 커밋에 포함된 파일만 Prettier/ESLint 자동 수정을 적용한다.

## NPM scripts

- 사용자가 실행하는 작업은 루트 `package.json` script로 제공한다.
- workspace script는 루트 script가 호출하는 내부 도구 명령으로만 둔다.
- 최적화보다 실행 순서와 대상이 바로 보이는 명령을 우선한다.

## 공통 규칙

- ESLint가 코드 규칙과 파일/폴더명을 검증한다.
- ESLint가 React Hooks 규칙을 검증한다.
- Prettier가 포맷을 검증하며 줄바꿈 기준은 120자다.
- TypeScript가 타입을 검증한다.
- `apps/*`, `packages/*`의 TS/TSX 파일과 `src` 하위 폴더명은 kebab-case다.
- `*.contract.ts`, `*.config.ts` 같은 중간 확장자는 허용한다.
- TanStack Router 라우트 파일과 generated API client는 프레임워크/생성기 규칙을 따른다.
- 앱 내부 absolute import는 `@/*`를 쓴다.
- workspace 간 import는 패키지 이름으로 한다.

## UI

- shadcn/ui CLI 대상은 `packages/ui`다.
- `packages/ui/src/components`의 shadcn/ui 컴포넌트는 직접 수정하지 않는다.
- `packages/ui/components.json`은 shadcn CLI 설정으로 유지한다.
- 앱은 `@nmm/ui/components`에서 필요한 컴포넌트를 import하고, 앱별 조합은 feature/page 코드에서 처리한다.
- `cn`은 `packages/ui/src/lib/utils.ts`에만 두며 앱 코드에서 import하지 않는다.
- web의 CSS entry는 `@nmm/ui/styles/globals.css`와 UI 패키지 Tailwind source만 연결한다.

## Frontend 구조

- `routes`는 TanStack Router 파일 라우팅과 search 검증 연결만 담당한다.
- `pages`는 라우트에 붙는 화면 조립 단위다.
- `features/<domain>`은 `api`, `model`, `hooks`, `ui`, `lib`, `index.ts` 구조를 우선 사용한다.
- feature `index.ts`는 page에서 써도 되는 공개 API만 export한다.
- 조회 pending은 Suspense fallback에 위임한다.
- 조회 error는 가장 가까운 ErrorBoundary가 잡고, 영역별 대체 UI가 필요하면 더 좁은 boundary를 둔다.
- 현재는 루트 라우트 범위의 넓은 `AppErrorBoundary`만 둔다.
- mutation pending은 이벤트 UI에서 직접 다루고, mutation error UX는 이후 요구사항이 생기면 정한다.

## API 계약

- Nest DTO로 OpenAPI spec을 만들고 Orval로 web fetch 함수와 타입을 생성한다.
- TanStack Query hook은 feature 코드에서 직접 작성한다.
- API 계약이 바뀌면 `npm run openapi:generate` 후 `openapi/api-server.json`과 generated fetch client/type을 함께 커밋한다.
- 인증 같은 공통 HTTP 처리가 필요해질 때만 Orval custom mutator를 추가한다.

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
