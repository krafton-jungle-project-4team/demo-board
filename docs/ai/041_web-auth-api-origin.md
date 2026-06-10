# Web auth API origin env

날짜: 2026-06-10

## 이유

분리된 Web/API 구조에서 Better Auth client가 auth server origin을 명시해야 한다.

## 작업

- 이 메모가 포함된 커밋에서 `VITE_NMM_API_ORIGIN`을 Web env 예시에 추가했다.
- Better Auth client가 `VITE_NMM_API_ORIGIN`을 `baseURL`로 쓰게 했다.
- 로컬 `apps/web-client/.env`에 개발 API origin을 설정했다.
- Web env 기준을 프로젝트 표준 문서에 추가했다.

## 결과

- `npm run verify` 통과.
