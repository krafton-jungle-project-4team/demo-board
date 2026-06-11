# React Doctor 100점 정리

날짜: 2026-06-11

## 이유

`npx react-doctor@latest` 기준 React 품질 점수를 100점으로 맞춘다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- post mutation hook에서 관련 query cache를 직접 invalidate/remove하게 했다.
- 검색 입력의 derived state/effect를 제거하고 submit 시 form data를 읽게 했다.
- 댓글 수정 draft가 prop을 초기 state로 복사하지 않게 했다.
- 게시글 수정 페이지의 prop 변경 reset effect를 `key` 기반 reset으로 대체했다.
- root route의 보조 컴포넌트를 별도 파일로 분리했다.
- 순수 로그인 handler를 module scope로 이동했다.
- UI 컴포넌트 파일의 non-component variants export를 별도 파일로 분리했다.
- 사용하지 않는 public export를 줄였다.

## 결과

- `npx react-doctor@latest --verbose`: 100 / 100
- `npm run verify` 통과
