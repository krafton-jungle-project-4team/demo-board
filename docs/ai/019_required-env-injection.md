# Env 기본값 제거

날짜: 2026-06-09

## 이유

API 서버 env는 항상 존재한다고 보고 `.env` 값을 그대로 주입해야 하는데, 코드와 compose에 개발 기본값이 남아 있었다.

## 작업

- 이 메모가 포함된 커밋에서 `serverEnv`의 기본값 fallback을 제거했다.
- `loadServerEnv`가 `apps/api-server/.env` 값을 `process.env`에 직접 주입하게 했다.
- `docker compose` 실행을 `--env-file apps/api-server/.env` 기준으로 바꿨다.
- compose의 `${VAR:-default}`를 `${VAR:?required}`로 바꿨다.
- 필요한 키를 `apps/api-server/.env.example`에 정리했다.

## 결과

- env 누락이나 형식 오류가 있으면 서버/compose 시작 단계에서 실패한다.
- 검증: `npm run verify`
