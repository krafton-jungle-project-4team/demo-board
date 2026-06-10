# 페이지네이션 더미 데이터

날짜: 2026-06-10

## 이유

기본 `pageSize=10`에서 게시글 목록의 다음 페이지를 확인할 수 있는 더미 데이터가 필요했다.

## 작업

- 이 메모가 포함된 커밋에서 `dummy-data.sql`의 게시글을 15개로 늘렸다.
- 태그와 댓글 예시를 추가해 목록/상세 화면 확인 범위를 넓혔다.

## 결과

- 로컬 Postgres에 `init-db.sql`, `dummy-data.sql`을 순서대로 적용했다.
- `GET /api/posts?page=2&pageSize=10&sort=created-desc&view=table`에서 `totalItems=15`, `totalPages=2`를 확인했다.
- `npm run verify` 통과.
