# Board repository 응답 경계 정리

날짜: 2026-06-09

## 이유

`PostRecord`, `NewPostRecord`, `NewCommentRecord`가 service에 저장소 내부 형태를 노출했다. 성능 문제가 생기기 전까지는 repository가 DB 엔티티와 API 응답 타입 사이 변환을 맡는 기준으로 정리한다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- board repository 계약이 `Post`/`Comment`를 반환하고, 생성/수정은 shared request와 `BoardUser`를 받게 했다.
- `PostRecord`, `NewPostRecord`, `NewCommentRecord`를 제거했다.
- 태그 ID 검증, 게시글/댓글 생성 시각, 엔티티 변환, 태그 조립을 TypeORM repository 구현으로 옮겼다.
- board service는 조회, 권한 확인, 응답 흐름만 담당하게 줄였다.

## 결과

- service가 저장소 내부 record 타입을 알지 않는다.
- repository가 DB 엔티티를 shared 응답 타입으로 조립한다.
- 검증: `npm run typecheck`, `npm run verify` 통과
