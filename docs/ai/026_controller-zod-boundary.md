# Controller Zod 경계 정리

날짜: 2026-06-10

## 이유

API 서버 service는 Zod schema 값을 알지 않고, controller가 요청/응답 계약 검증 경계를 맡는다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- auth, board service에서 `*Schema.parse`와 schema 값 import를 제거했다.
- service는 shared contract type만 받아 반환하게 유지했다.
- auth, board controller가 요청 body/query/param과 service 응답을 shared Zod schema로 파싱하게 했다.
- board entity에 `from`, `to*` 메서드를 추가해 DB 값 정규화와 API 객체 변환을 맡겼다.
- 저장 후 응답은 service가 다시 조회한 entity 기준으로 만든다.
- 프로젝트 표준에 controller/service 계약 경계를 명시했다.

## 결과

- service 폴더에는 Zod schema 값과 `.parse(...)` 호출이 남지 않는다.
- 검증: `npm run typecheck -w @nmm/api-server`, `npm run verify` 통과
- 후속 작업: 없음
