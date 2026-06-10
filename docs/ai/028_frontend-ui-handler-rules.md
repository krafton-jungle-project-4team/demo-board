# FE UI/핸들러 규칙 정리

날짜: 2026-06-10

## 이유

web-client의 UI 구현 범위와 JSX 핸들러 작성 방식을 일관되게 유지하기 위해서다.

## 작업

- 완료 커밋: 이 메모가 포함된 커밋
- UI primitive는 `@nmm/ui/components`를 우선 쓰고, 의미/레이아웃 태그는 허용한다고 문서화했다.
- 앱별 CSS와 직접 theme token 수정을 금지하고, shadcn `baseColor` 범주만 허용한다고 문서화했다.
- `packages/ui/src/styles/globals.css`를 shadcn neutral 기본 token 값으로 되돌렸다.
- JSX 안의 익명 함수식을 ESLint `no-restricted-syntax`로 금지했다.
- web-client의 JSX 이벤트/render prop 익명 함수를 이름 있는 핸들러로 바꿨다.

## 결과

- shadcn 컴포넌트 사용 범위와 CSS 변경 경계가 명확해졌다.
- JSX prop과 render-function children에는 이름 있는 함수만 전달된다.
- `npm run verify`가 통과했다.
