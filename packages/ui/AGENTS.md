# UI 패키지 지침

## 범위

- `packages/ui`에 적용한다.
- 이 package는 app과 무관한 shadcn/Radix primitive를 제공한다.

## 허용

- React primitive component.
- shadcn/Radix/lucide/cva/clsx/tailwind-merge 유틸.
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

## 스킬

- Primitive API 판단에는 `vercel-composition-patterns`를 적용한다.
- UI 품질에는 `toss-frontend-fundamentals`, `web-design-guidelines`를 적용한다.

## 확인

- 변경 후 루트 `npm run verify`를 실행한다.
