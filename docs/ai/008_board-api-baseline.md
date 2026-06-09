# 게시판 BE 기본 기능

날짜: 2026-06-09

## 이유

005의 게시판 보일러플레이트와 007의 세션 인증 설계 다음 단계로, 실제 BE API 표면을 기본 게시판 요구사항에 맞춰 넓히기 위해서다.
007은 최종 세션 인증 방향을 정한 설계 기록이다.
아직 DB/ORM은 없으므로 이번 작업은 그 인증 설계를 완성하는 것이 아니라, 게시판 필수 기능 검증용 in-memory API 계약과 동작을 먼저 고정한다.

## 작업

- 기준 커밋: `7c37644`
- 완료 커밋: 이 메모가 포함된 커밋
- shared 계약에 회원가입/로그인, 사용자, 게시글 태그, 댓글 schema를 추가했다.
- 007의 최종 인증 구현과 구분되는 임시 `AuthService`를 추가하고 회원가입, 로그인, 현재 사용자 조회 API 표면을 만들었다.
- 로그인 후 받은 `sessionToken`은 `Authorization: Bearer <token>`으로 쓰기 API에 전달한다.
- API에 `BoardService`를 추가하고 게시글 CRUD, 댓글 CRUD, 태그 조회를 in-memory로 구현했다.
- 게시글 목록은 `q`, `tagId`, `page`, `pageSize`, `sort` 기반 필터/검색/페이징을 실제로 수행한다.
- 태그는 별도 `PostTag` 데이터로 두고 name을 고유하게 유지한다.
- 일반 사용자용 태그 생성/수정/삭제 API는 만들지 않았다.
- 게시글과 댓글 생성/수정/삭제는 로그인한 사용자만 가능하게 했다.
- 게시글 본문과 댓글은 마크다운 처리 없이 순수 text로 받는다.
- OpenAPI spec과 web generated client를 갱신했다.
- 기존 web 컴파일 호환을 위해 post form 기본값에 `tagIds`를 추가했다.

## 결과

- 기본 게시판 BE 요구사항인 회원가입/로그인, 게시글 CRUD, 댓글, 태그, 페이징, 검색 API가 준비됐다.
- 회원가입/로그인은 DB-backed session 구현이 아니라 in-memory 게시판 API 검증용이다.
- 게시글 CRUD 화면은 frontend에서 모달이 아니라 page route로 연결해야 한다. 이번 BE 작업은 modal 전용 API를 만들지 않았다.
- 실행 중인 서버에서 태그 조회, 검색/페이징, 로그인, 인증 게시글 작성, 댓글 작성/조회를 HTTP로 확인했다.
- `npm run openapi:generate`와 `npm run verify`가 통과했다.
