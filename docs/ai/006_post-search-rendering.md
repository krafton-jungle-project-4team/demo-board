# 게시글 검색 렌더링 수정

날짜: 2026-06-08

## 이유

005에서 게시글 목록 조회를 Suspense 기반으로 연결한 뒤, 검색 input 입력마다 URL 상태와 query key가 즉시 바뀌었다.
캐시에 없는 검색어는 목록 query가 다시 pending이 되며 루트 Suspense fallback까지 올라가 화면 전체가 멈춘 것처럼 보였다.

## 작업

- 기준 커밋: `42dfee5`
- 완료 커밋: 이 메모가 포함된 커밋
- 게시글 목록 query를 `useSuspenseQuery`에서 `useQuery`로 바꾸고 `keepPreviousData`를 적용했다.
- 목록 query error는 기존 ErrorBoundary가 받을 수 있도록 `throwOnError`를 켰다.
- 검색 input은 로컬 초안 값을 먼저 갱신하고, 검색 버튼/form submit 때 URL 상태에 반영하게 했다.
- 검색어 `q`는 URL에 base64url로 저장해 한글 같은 비영어 문자열의 percent encoding 팽창을 줄였다.
- query params 객체를 memoization해서 같은 URL 상태에서는 같은 조회 입력을 유지하게 했다.

## 결과

- 새 검색어 요청 중에도 기존 목록 UI가 유지되어 input 입력 시 전체 화면 fallback이 발생하지 않는다.
- 입력 후 몇 초 동안 작업이 없으면 자동 요청하는 debounce 방식은 기본값으로 두지 않았다.
- 첫 목록 로딩만 목록 영역 안에서 `불러오는 중`으로 표시된다.
- 실행 중인 서버에서 입력 중 화면이 멈추지 않는 것을 확인했다.
- 임시 Playwright 테스트로 한글 검색어가 submit 전에는 URL에 없고, submit 후 base64url `q`로 저장되는 것을 확인했다.
- `npm run lint`, 변경 파일 Prettier check, `npm run typecheck`, `npm run build`가 통과했다.
