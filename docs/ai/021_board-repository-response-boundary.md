# Board repository 응답 경계 정리

날짜: 2026-06-09

## 이유

`PostRecord`, `NewPostRecord`, `NewCommentRecord`가 service에 저장소 내부 형태를 노출했다. repository는 persistence 결과를 board entity로 정규화해 반환하고, API 응답 조립은 service 경계에서 처리한다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- board repository 계약이 `PostEntity`/`CommentEntity`/`PostTagEntity`를 반환하고, 생성/수정은 shared request와 `BoardUser`를 받게 했다.
- `PostRecord`, `NewPostRecord`, `NewCommentRecord`를 제거했다.
- 태그 ID 검증, 게시글/댓글 생성 시각, TypeORM 결과 정규화를 repository 구현으로 옮겼다.
- board service가 entity를 shared API 응답으로 변환하고 권한 확인을 담당하게 했다.

## 결과

- service가 저장소 내부 record 타입을 알지 않는다.
- repository가 board entity를 반환하고, shared 응답 타입은 service가 조립한다.
- 검증: `npm run typecheck`, `npm run verify` 통과
