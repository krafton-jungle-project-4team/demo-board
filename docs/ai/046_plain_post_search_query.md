# 게시글 검색어 URL 인코딩 정리

날짜: 2026-06-11

## 이유

게시글 검색어 URL 파라미터에 직접 base64url 변환을 쓰고 있어 코드가 과했다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- `nuqs`의 `parseAsString`으로 검색어 파서를 바꿨다.
- base64url 직렬화/파싱 코드를 제거했다.
- 검색어 URL 인코딩은 URLSearchParams 표준 처리에 맡겼다.

## 결과

- `npm run verify` 통과
