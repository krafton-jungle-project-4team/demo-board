# Shared 패키지 지침

## 범위

- `packages/shared`에 적용한다.
- 이 package에는 framework와 무관한 contract와 순수 logic만 둔다.

## 허용

- Zod schema.
- Infer한 TypeScript type.
- Runtime/framework 의존이 없는 순수 domain helper.

## 금지

- React, Vite, Nest, Node runtime API, DB, app code, UI package import.

## Contract

- Request/response contract source는 `src/contracts`에 둔다.
- Schema와 type을 함께 export한다.
- Contract의 API ID는 number로 유지하고 URL string은 API boundary에서 parse한다.
- Command response는 full resource가 아니라 필요한 identifier를 반환한다.
- API 계약 원본은 Zod schema다.
- API 계약 변경은 API server와 web client 경계 코드 변경과 같은 작업 단위로 묶는다.

## 확인

- 변경 후 루트 `npm run verify`를 실행한다.
