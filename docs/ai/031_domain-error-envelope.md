# DomainError 전역 응답 처리

날짜: 2026-06-10

## 이유

Service가 던지는 앱 에러를 HTTP 예외가 아니라 도메인 에러로 두고, 전송 계층에서 request id와 표준 에러 응답으로 변환해야 한다. 전역 에러 코드는 타입과 생성만 관리하고, 실제 에러 정의는 각 feature 내부에 둔다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- `app-errors.ts`에 `DomainError` 타입과 생성 함수만 남겼다.
- auth/board 에러 정의를 각 feature 내부 파일로 옮겼다.
- 앱 에러의 HTTP status code를 feature 내부에서 정수 값으로 관리하게 했다.
- 전역 exception filter가 `DomainError`를 받아 HTTP status와 `{ requestId, error: { code, message } }`로 응답하게 했다.
- 프로젝트 표준에 `DomainError`와 전역 filter 책임을 추가했다.

## 결과

- 앱 에러 생성은 Nest HTTP 계층에 의존하지 않는다.
- 도메인별 에러 정의는 해당 feature 내부에서만 참조된다.
- 전역 filter가 request id를 붙여 표준 에러 envelope를 반환한다.
- 검증: `npm run verify` 통과
