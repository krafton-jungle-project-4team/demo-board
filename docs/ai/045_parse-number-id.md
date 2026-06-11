# URL number id parser rename

날짜: 2026-06-11

## 이유

게시글 검색 URL parser 이름을 ID 값 규칙에 맞게 정리해야 했다.

## 작업

- 이 메모가 포함된 커밋에서 `parseAsPositiveInteger`를 `parseAsNumberId`로 이름만 바꿨다.

## 결과

- `npm run verify` 통과.
