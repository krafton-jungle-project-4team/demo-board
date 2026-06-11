# Web client Toss 품질 정리

날짜: 2026-06-11

## 이유

Toss Frontend Fundamentals 기준으로 게시글 UI의 숨은 변환, API 보정 의존, 요청 타입 결합을 줄여 변경하기 쉽게 만든다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- 게시글 검색 Select 값을 명시적 parser로 변환하게 했다.
- 게시글 검색어 trim과 page size를 검색 모델에 모았다.
- 게시글 폼이 API 요청 타입 대신 UI 전용 `PostFormValues`를 쓰게 했다.
- 댓글 정렬 보정을 web client에서 제거하고 API가 생성일 오름차순으로 반환하게 했다.
- 게시글 목록 API는 SQL 직접 작성 없이 기존 repository 기반 흐름을 유지했다.
- Vite dev/preview API proxy 설정 중복을 제거했다.
- 로컬 `.codex` 스킬 문서는 ESLint 전체 검사 대상에서 제외했다.

## 결과

- `npm run verify` 통과
- Toss 기준 재검사에서 추가 수정 대상 없음
