# App root 폴더 규칙 정리

날짜: 2026-06-11

## 이유

`app/ui`가 `packages/ui`, feature `ui`와 의미가 겹쳤다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- root route 구성요소를 `app/ui`에서 `app/root`로 옮겼다.
- `packages/ui`를 앱 독립 reusable UI primitive 패키지로 문서화했다.
- `app`, `app/providers`, `app/root`, feature `ui`의 역할을 문서화했다.
- root route의 작은 액션/상태/fallback UI가 `@nmm/ui/components` primitive를 우선 쓰게 했다.

## 결과

- `npm run verify` 통과
