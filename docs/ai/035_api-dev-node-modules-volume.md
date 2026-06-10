# API 개발 서버 기동 복구

날짜: 2026-06-10

## 이유

`npm run dev:api` 실행 시 API 컨테이너가 새 의존성을 찾지 못했고, 이후 환경 스키마 초기화 순서 때문에 런타임에서 중단됐다.

## 작업

- 이 메모가 포함된 커밋에서 API 개발 컨테이너 시작 전에 `HUSKY=0 npm ci`를 실행하게 했다.
- `package-lock.json` 기준으로 `node_modules` 볼륨을 갱신한 뒤 shared 빌드와 Nest watch 서버를 시작하게 했다.
- `serverEnv` 생성을 환경 스키마 선언 뒤로 옮겨 초기화 순서 오류를 제거했다.

## 결과

- `npm run dev:api`로 Nest 애플리케이션 정상 시작을 확인했다.
- `GET /api/health` 응답과 요청 로그의 `requestId` 출력을 확인했다.
- `npm run verify`가 통과했다.
