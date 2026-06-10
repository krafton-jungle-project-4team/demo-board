# Auth callback absolute URL

날짜: 2026-06-10

## 이유

Better Auth client의 API `baseURL` 때문에 상대 callback 경로가 API origin으로 해석됐다.

## 작업

- 이 메모가 포함된 커밋에서 GitHub 로그인 callback URL들을 현재 Web origin의 absolute URL로 변환하게 했다.

## 결과

- `npm run verify` 통과.
