# Web production preview 실행 추가

날짜: 2026-06-11

## 이유

React DevTools로 dev-only 렌더링이 아닌 production 조건 렌더링과 Profiler를 확인해야 한다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- 루트에 profiling build 후 Vite preview를 실행하는 `npm run preview:web` 스크립트를 추가했다.
- web workspace에 Vite preview 스크립트를 추가했다.
- web workspace에 profiling build 스크립트를 추가했다.
- Vite profile mode에서 `react-dom/client`만 `react-dom/profiling`으로 alias했다.
- Vite preview에서도 `/api` proxy가 동작하게 했다.
- production 조건 렌더링과 Profiler 확인 시 `npm run preview:web`을 쓰도록 문서화했다.

## 결과

- `npm run build:profile -w @nmm/web-client` 통과
- `npm run verify` 통과
