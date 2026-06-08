# 프로젝트 표준 검증 추가

날짜: 2026-06-08

## 이유

bulletproof-react의 프로젝트 표준을 참고해 ESLint, Prettier, TypeScript, Husky 기반 검증을 추가하기 위해서다.
002에서 web/api/shared 보일러플레이트가 만들어졌지만, 모듈 경계와 코드 스타일을 자동으로 강제하는 장치가 없었다.

## 작업

- 기준 커밋: `5f392ff`
- 완료 커밋: 이 메모가 포함된 커밋
- 대상 구조: 002에서 만든 `apps/web-client`, `apps/api-server`, `packages/shared`
- 자체 검증 스크립트를 제거했다.
- `eslint.config.mjs`에 모듈별 import 제약, file/folder naming, React Hooks 규칙을 추가했다.
- `prettier.config.mjs`, `.prettierignore`, `.husky/pre-commit`, `lint-staged`를 추가했다.
- `eslint.config.mjs`를 모듈별 섹션 중심으로 단순화했다.
- `@/*` absolute import를 web/shared에 적용하고 API에 설정을 추가했다.
- `App.tsx`를 `app.tsx`로 바꿔 파일명 규칙을 맞췄다.
- `docs/project-standards.md`와 `AGENTS.md`에 간결한 표준을 적었다.
- `npm run lint`, `format:check`, `verify`를 추가했다.
- 004에서 이 검증 체계 위에 TSConfig 기준을 추가로 정리했다.

## 결과

`npm run verify`로 lint, format check, typecheck, build가 통과했다.
