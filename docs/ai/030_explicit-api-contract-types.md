# API 계약 타입 명시

날짜: 2026-06-10

## 이유

Schema 추론만 쓰면 API 경계에서 실제 request/response 객체 타입이 잘 드러나지 않는다. 경계 코드는 검증 schema와 contract type을 함께 보여야 읽기 쉽다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- Web HTTP 함수에 명시적 `Promise<...Response>` 반환 타입을 추가했다.
- Web command 요청 본문을 `body` 변수로 분리했다.
- route id raw 인자와 path용 전처리 변수를 분리했다.
- API server controller에 request/response 타입과 지역 변수를 명시했다.
- 프로젝트 표준에 API contract type 명시와 전처리 변수 분리 규칙을 추가했다.

## 결과

- API 경계에서 schema 검증과 request/response 객체 타입이 함께 보인다.
- 경로 생성 코드에서 inline 전처리를 줄였다.
- 검증: `npm run verify` 통과
