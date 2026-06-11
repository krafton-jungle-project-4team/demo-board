# Query Error Reset Boundary 정리

날짜: 2026-06-11

## 이유

Root route의 React Query error reset 연결을 render prop 함수 대신 hook 기반 컴포넌트로 단순화한다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- `__root.tsx`에 `RootRouteBoundary`를 추가했다.
- `useQueryErrorResetBoundary`로 reset 함수를 읽어 `AppErrorBoundary`에 전달했다.
- `renderQueryErrorResetBoundary`와 전용 props type을 제거했다.

## 결과

- 검증: `npm run verify`
- 후속 작업: 없음
