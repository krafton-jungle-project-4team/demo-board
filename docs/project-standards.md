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

## 공통 규칙

- ESLint가 코드 규칙과 파일/폴더명을 검증한다.
- ESLint가 React Hooks 규칙을 검증한다.
- Prettier가 포맷을 검증한다.
- TypeScript가 타입을 검증한다.
- `apps/*`, `packages/*`의 TS/TSX 파일과 `src` 하위 폴더명은 kebab-case다.
- `*.contract.ts`, `*.config.ts` 같은 중간 확장자는 허용한다.
- 앱 내부 absolute import는 `@/*`를 쓴다.
- workspace 간 import는 패키지 이름으로 한다.

## TypeScript 설정

기준: https://www.totaltypescript.com/tsconfig-cheat-sheet

- 공통 strict/base 옵션은 `tsconfig.base.json`에 둔다.
- Vite web과 shared는 `module: "preserve"`와 `noEmit: true`를 쓴다.
- Nest API는 tsc 출력이 필요하므로 `module: "NodeNext"`, `outDir`, `sourceMap`, `declaration`을 쓴다.
- Nest API는 현재 CJS 출력 호환을 위해 `verbatimModuleSyntax: false`를 유지한다.

## 모듈 규칙

| 모듈              | 허용                                               | 금지                                  |
| ----------------- | -------------------------------------------------- | ------------------------------------- |
| `apps/web-client` | React, Vite, `@nmm/shared`, 내부 상대 import       | `apps/api-server`, Nest, Node 런타임  |
| `apps/api-server` | Nest, Node 런타임, `@nmm/shared`, 내부 상대 import | `apps/web-client`, React, Vite        |
| `packages/shared` | `zod`, 내부 상대 import                            | 앱 코드, React, Nest, Node 런타임, DB |

## 구현 위치

- ESLint: `eslint.config.mjs`
- Prettier: `prettier.config.mjs`, `.prettierignore`
- Husky/lint-staged: `.husky/pre-commit`, 루트 `package.json`
- 실행 연결: 루트 `package.json`의 `lint`, `format:check`, `typecheck`, `build`, `verify`
