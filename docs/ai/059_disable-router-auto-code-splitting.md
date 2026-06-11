# Router 자동 코드 분할 비활성화

날짜: 2026-06-11

## 이유

게시글 상세 화면에서 `tsr-split=component` 동적 import URL을 불러오지 못해 화면 로딩이 실패했다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- TanStack Router Vite plugin의 `autoCodeSplitting` 설정을 제거했다.
- 상세 라우트 dev server 응답이 동적 import 없이 직접 페이지 컴포넌트를 import하는 것을 확인했다.

## 결과

- 게시글 상세 route chunk의 동적 import 실패 경로를 제거했다.
- 검증: `npm run verify` 통과
