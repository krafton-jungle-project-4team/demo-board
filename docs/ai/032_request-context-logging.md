# NestJS Pino Logging

날짜: 2026-06-10

## 이유

API 서버 앱 로그에 요청 단위 `requestId`, 인증 후 `sessionId`와 `userId`를 함께 남겨 추적 가능하게 한다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- `nestjs-pino`, `pino-http`를 API 서버 의존성으로 추가했다.
- `LoggerModule.forRoot`와 `NativeLogger`로 Nest 기본 `Logger` 호출을 pino JSON 로그로 연결했다.
- `pino-http`의 `genReqId`가 기존 `getRequestId`를 써서 `x-request-id`와 응답 envelope 값을 맞추게 했다.
- 인증 guard가 `AuthClaims`를 얻은 뒤 `PinoLogger.assign()`으로 `sessionId`, `userId`를 이후 로그에 붙이게 했다.
- `ASSERT_*` 로그를 `@nestjs/common` `Logger`로 바꿨다.

## 결과

- 요청 처리 중 `Logger` 로그는 `requestId`, 가능한 경우 `sessionId`, `userId`를 포함한다.
- 검증: `npm run verify`
