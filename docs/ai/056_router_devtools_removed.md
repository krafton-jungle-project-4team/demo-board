# Router Devtools 제거

날짜: 2026-06-11

## 이유

TanStack Router Devtools는 현재 라우팅 디버그 필요성이 없어 root route에서 제외한다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- `__root.tsx`에서 TanStack Router Devtools lazy import와 렌더링을 제거했다.
- 필요 시 Devtools를 도입할 수 있다는 JSX 주석을 남겼다.

## 결과

- 검증: `npm run verify`
- 후속 작업: 라우팅 디버그 필요가 생기면 Devtools를 다시 추가한다.
