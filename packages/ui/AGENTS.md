# UI 패키지 지침

## 범위

- `packages/ui`에 적용한다.
- 이 package는 app과 무관한 shadcn/Radix primitive를 제공한다.

## 허용

- React primitive component.
- shadcn/Radix/lucide/cva/clsx/tailwind-merge 유틸.
- `@base-ui/react`는 공식 shadcn Combobox 구현을 따르기 위한 예외로 허용한다.
- `#lib/*` 같은 package 내부 import.

## 금지

- App domain code.
- API server code.
- Shared contract.
- Nest, Node runtime API, Vite app code.

## 규칙

- Public primitive는 `src/components.ts`에서 export한다.
- `cn`은 `src/lib/utils.ts`에 둔다.
- 가능한 경우 shadcn-compatible component API를 유지한다.
- shadcn/ui CLI 대상은 `packages/ui`다.
- `components.json`은 shadcn CLI 설정으로 유지한다.
- 색상 변경은 shadcn `tailwind.baseColor` 범주 안에서 고른다.
- `src/styles/globals.css`는 shadcn 기본 scaffold 중심으로 유지한다.

## 스킬

- shadcn primitive 검색, 추가, 업데이트, 조합에는 설치된 `shadcn` skill을 참고한다.
- `shadcn` skill과 충돌하면 이 파일의 package 경계, export, CLI 대상, 검증 규칙을 우선한다.
- Primitive API 판단에는 `vercel-composition-patterns`를 적용한다.
- UI 품질에는 `toss-frontend-fundamentals`, `web-design-guidelines`를 적용한다.

## 확인

- 변경 후 루트 `npm run verify`를 실행한다.
