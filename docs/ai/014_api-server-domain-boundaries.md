# API 서버 도메인 경계 정리

날짜: 2026-06-09

## 이유

API 서버 service가 Nest HTTP 예외와 외부 OAuth 호출 세부사항을 직접 다뤄 도메인 판단, 전송 계층 변환, 인프라 구현이 섞여 있었다. 도메인 오류와 HTTP 오류를 분리하고, 올바른 작업 순서를 좁은 인터페이스로 강제할 필요가 있었다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- 공통 `DomainError`를 추가하고, 오류 code/message를 도메인에서 관리하게 했다.
- 글로벌 HTTP exception filter가 도메인 오류를 표준 에러 응답으로 변환하게 했다.
- 글로벌 response interceptor가 JSON 성공 응답을 `{ requestId, data }`로 감싸게 했다.
- `board` service에서 Nest HTTP 예외를 제거하고 `BoardDomainError`를 사용하게 했다.
- `auth`, `board`의 domain에 entity, provider 인터페이스와 도메인 record를 두고, database repository가 이를 구현하게 했다.
- 도메인 오류의 HTTP status 변환은 domain이 아니라 controller/web server boundary mapper에 두었다.
- service 파일을 query(read only)와 command(변경 목적)로 나눴다.
- 게시글 저장/삭제와 태그 링크/댓글 삭제는 repository의 좁은 트랜잭션 메서드 뒤로 숨겼다.
- OAuth provider 인터페이스는 auth domain에 두고, GitHub OAuth 호출과 응답 파싱은 infrastructure 구현체로 분리했다.
- Auth service는 OAuth 인프라 실패를 auth 도메인 오류로 변환하게 했다.
- Zod schema를 OpenAPI schema로 바꾸는 helper를 추가하고, OpenAPI DTO class를 제거했다.
- web generated client를 표준 응답 형식에 맞게 갱신하고, web feature 타입은 shared contract를 우선 쓰게 했다.
- 프로젝트 표준에 응답 형식, 도메인 오류, 외부 클라이언트 경계 규칙을 추가했다.
- Prettier 들여쓰기 기준을 4칸으로 바꾸고 전체 포맷을 적용했다.
- API 서버 env 파일은 `apps/api-server/.env`로 고정하고, 없으면 시작 시 예외가 나게 했다.
- 도메인별 env 필드 타입을 정의하고, common env가 `serverEnv` 전역 객체를 생성하게 했다.

## 결과

- JSON 성공 응답은 `{ requestId, data }`, JSON 에러 응답은 `{ requestId, error: { code, message } }`가 된다.
- 도메인 오류는 HTTP status를 직접 알지 않고, controller/web server boundary mapper가 HTTP status를 결정한다.
- database 구현체는 TypeORM/DataSource를 알고, service는 domain provider 인터페이스에 의존한다.
- OAuth는 구현 중심 인프라 코드가 되었고, auth command service가 그 결과와 실패를 감싼다.
- API 계약 원본은 shared Zod schema이고, OpenAPI는 FE 요청 함수 생성을 위한 산출물이 된다.
- 프로젝트 포맷은 4칸 들여쓰기와 120자 줄바꿈 기준을 쓴다.
- env 사용자는 `process.env` 대신 `serverEnv` 필드를 사용한다.
- 검증: `npm run openapi:generate`, `npm run typecheck`, `npm run format:check`, `npm run verify` 통과
- 런타임 검증: `npm run dev:api -- -d` 후 `/api/health`, `/api/posts`, board 404, auth 401 표준 응답 확인
