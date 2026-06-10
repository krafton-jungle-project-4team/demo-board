# Service Call Debug Logs

날짜: 2026-06-10

## 이유

API 서버 service 호출 여부를 요청 로그 흐름에서 확인할 수 있게 한다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- auth, board service public method 진입 지점에 `Logger.debug()` 호출 로그를 추가했다.
- 로그 메시지는 method 호출 여부만 남기고 요청 본문이나 토큰 값은 남기지 않았다.

## 결과

- 요청 중 service method가 호출되면 pino JSON 로그에 service context, method 호출 메시지, request context가 함께 남는다.
- 검증: `npm run verify`
