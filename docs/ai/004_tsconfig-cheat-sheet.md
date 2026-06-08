# TSConfig 정리

날짜: 2026-06-08

## 이유

Total TypeScript TSConfig Cheat Sheet를 기준으로 현재 모노레포의 TypeScript 설정을 정리하기 위해서다.

## 작업

- 기준 커밋: `9825124`
- 완료 커밋: 이 메모가 포함된 커밋
- `tsconfig.base.json`에 `allowJs`와 `verbatimModuleSyntax`를 추가했다.
- web/shared의 중복 `moduleResolution`, `verbatimModuleSyntax`를 제거했다.
- API의 `module`을 `NodeNext`로 바꿨다.
- Nest API는 CJS 출력 호환을 위해 `verbatimModuleSyntax: false`를 유지했다.
- `docs/project-standards.md`에 TypeScript 설정 기준을 추가했다.

## 결과

`npm run verify`로 lint, format check, typecheck, build가 통과했다.

## 참고

- https://www.totaltypescript.com/tsconfig-cheat-sheet
