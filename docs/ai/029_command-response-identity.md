# Command 응답 식별자 정리

날짜: 2026-06-10

## 이유

Command API는 변경 작업 결과로 전체 리소스 데이터를 반환하지 않는다. 후속 화면이나 캐시 갱신에 필요한 식별자만 반환하고, 최신 데이터는 Query API가 읽는다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- auth command 응답을 `{ userId }`로 변경했다.
- post command 응답을 `{ postId }`로 변경했다.
- comment command 응답을 `{ commentId }`로 변경했다.
- 삭제 응답의 `ok` 필드를 제거했다.
- API server controller에서 command 후 query service 재조회를 제거했다.
- Web API 파서와 mutation 성공 처리를 command 응답 모델에 맞췄다.
- current user 갱신은 command 응답 캐시 세팅 대신 Query invalidate로 처리했다.
- 프로젝트 표준에 Command 응답 규칙을 추가했다.

## 결과

- Command 응답은 API별 필수 식별자를 반환한다.
- 전체 리소스 데이터는 Query API에서만 반환한다.
- 검증: `npm run verify` 통과
