# Ky 기반 HTTP 클라이언트 정리

날짜: 2026-06-10

## 이유

수동 typed API 함수는 유지하되 query string, JSON body/header 같은 기본 HTTP 처리는 직접 구현하지 않는다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- web client에 `ky`를 추가했다.
- 공통 API 클라이언트가 `/api` prefix, cookie 포함, JSON 요청, search params 처리를 `ky`에 위임하게 했다.
- 공통 API 클라이언트의 기본 재시도는 3회, timeout은 1초로 설정했다.
- 기존 표준 응답 envelope 파싱과 `ApiClientError` 변환은 유지했다.
- feature API 호출부를 `json`, `searchParams` 옵션으로 바꿨다.
- 프로젝트 표준의 typed fetch 표현을 typed HTTP 함수로 정리했다.

## 결과

- `toQueryString`, JSON body/header 수동 변환을 제거했다.
- 검증: `npm run typecheck -w @nmm/web-client`, `npm run verify` 통과
- 후속 작업: 없음
