# 기본 dev 웹 전용 실행

날짜: 2026-06-10

## 이유

`npm run dev`가 API Docker Compose까지 실행해 Postgres를 함께 띄웠다. 웹 화면 개발만 할 때도 DB가 떠서 기동이 무거웠다.

## 작업

- 이 메모가 포함된 커밋에서 `npm run dev`를 `dev:web` 실행으로 바꿨다.
- 기존 web+api 동시 실행은 `npm run dev:all`로 분리했다.
- 프로젝트 표준에 기본 dev와 API/DB 실행 기준을 추가했다.

## 결과

- `npm run dev`가 shared build 후 Vite만 실행하고 Docker를 실행하지 않는 것을 확인했다.
- `npm run verify`가 통과했다.
