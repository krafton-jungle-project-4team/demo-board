# 게시글 command 후 중복 refetch 정리

날짜: 2026-06-11

## 이유

게시글 command 성공 후 query invalidate와 페이지 이동이 겹쳐 취소된 GET이 보일 수 있었다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- 게시글 생성/수정/삭제 성공 시 목록 query는 stale 처리만 하고 즉시 refetch하지 않게 했다.
- 게시글 수정 성공 시 상세 query도 stale 처리만 하고 즉시 refetch하지 않게 했다.
- 화면에 남아 갱신이 필요한 댓글 query invalidate는 즉시 refetch를 유지했다.

## 결과

- `npm run verify` 통과
