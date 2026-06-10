# API Server Env Schema

날짜: 2026-06-10

## 이유

API 서버 env 파싱 helper를 줄이고 필수 키와 형변환 규칙을 한 schema에 모은다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- `dotenv`, `zod`를 API 서버 의존성에 추가했다.
- `.env` 파일 로딩은 `dotenv.config()`로 바꿨다.
- `serverEnv` 생성 시 `ServerEnvSchema.parse(process.env)`로 필수 env, 숫자, boolean 값을 검증한다.
- 기존 `readStringEnv`, `readBooleanEnv`, `readNumberEnv` helper를 제거했다.

## 결과

- env가 누락되거나 형식이 틀리면 서버 부팅 중 schema parse 단계에서 실패한다.
- 검증: `npm run verify`
