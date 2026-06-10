# API 개발 의존성 설치 캐시

날짜: 2026-06-10

## 이유

API 개발 컨테이너가 시작할 때마다 `npm ci`를 실행해 `npm run dev` 기동이 느렸다.

## 작업

- 이 메모가 포함된 커밋에서 API 개발 엔트리포인트를 추가했다.
- `package-lock.json` 해시를 `node_modules` 볼륨에 저장하고, 해시가 바뀐 경우에만 `npm ci`를 실행하게 했다.
- Compose command는 엔트리포인트 스크립트 호출로 단순화했다.

## 결과

- 두 번째 `npm run dev:api` 실행에서 `package-lock unchanged; skipping npm ci.`를 확인했다.
- `npm run verify`가 통과했다.
