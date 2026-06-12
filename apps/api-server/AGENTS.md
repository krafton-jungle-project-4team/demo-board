# API 서버 지침

## 범위

- `apps/api-server`에 적용한다.
- 이 앱은 workspace 코드 중 `@nmm/shared`만 import한다.
- Web, UI, React, Vite 코드를 import하지 않는다.

## 구조

- 루트 source에는 `main.ts`, `app.module.ts`, `app-errors.ts`, `core`, `infra`, `features`를 둔다.
- 공통 순수 코드는 `core`, 전역 인프라/프레임워크 코드는 `infra`에 둔다.
- Feature 폴더는 `controller`, `service`, `database`, 필요한 경우 `index.ts`를 쓴다.
- TypeORM entity는 `database`에 둔다.
- 실제 도메인을 추가할 때 읽기/query service와 쓰기/command service를 분리한다.
- `domain` 레이어와 repository interface/구현체 레이어는 두지 않는다.

## API

- Controller는 params/query/body/response를 shared Zod contract로 검증한다.
- Service는 schema 값이 아니라 shared contract type을 쓴다.
- 성공 응답은 `{ requestId, data }`다.
- 에러 응답은 `{ requestId, error: { code, message } }`다.
- Controller와 Web HTTP 함수는 request/response contract type을 명시하고, schema는 경계 검증에 쓴다.
- 도메인별 에러 code/message/status는 해당 feature 내부에 둔다.

## 인증과 DB

- `better-auth`와 `typeorm`은 템플릿 의존성으로 유지한다.
- 인증을 추가하면 Controller method는 guard와 auth decorator로 auth를 받는다.
- Controller에서 인증 헤더/cookie를 직접 읽지 않는다.
- 예시 feature는 TypeORM 구조를 보여주기 위해 `synchronize`를 쓴다.
- 실제 도메인 DB를 추가하면 migration을 만들고 TypeORM `synchronize`는 false로 둔다.
- TypeORM entity의 DB 값 정규화와 API 객체 변환은 entity의 `from`, `to*` 메서드에 둔다.
- Service는 TypeORM repository/DataSource를 직접 주입받아 DB를 다룬다.
- Service는 다른 service를 주입하지 않는다.
- Service method는 외부 API만 public으로 두고 내부 helper는 private으로 둔다.
- Read service method는 조회와 가공 중간 변수에 이름을 붙여 반환한다.
- 앱에서 생성되는 리소스 ID는 DB auto-increment를 우선 사용한다.
- API 요청/응답 ID는 숫자로 다루고 URL 파라미터 경계에서만 문자열을 숫자로 파싱한다.
- 필요한 env 키는 `apps/api-server/.env.example`에 둔다.

## 확인

- 변경 후 루트 `npm run verify`를 실행한다.
- API dev server는 루트 `npm run dev` 또는 `npm run dev:api`로만 실행한다.
