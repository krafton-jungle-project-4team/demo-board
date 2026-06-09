# Board 인증 사용자 타입 정리

날짜: 2026-06-09

## 이유

`BoardUser`가 auth의 `ActiveUser`와 같은 의미를 board feature 안에 중복 정의했다. 게시글/댓글 변경은 인증 완료 후 활성화된 사용자만 수행해야 하므로 auth 도메인의 `ActiveUser`를 기준으로 쓴다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- `BoardUser` 타입과 export를 제거했다.
- board repository, command service, TypeORM repository의 사용자 파라미터를 `ActiveUser`로 바꿨다.

## 결과

- board feature가 별도 사용자 타입을 만들지 않고 인증 완료 사용자 의미를 재사용한다.
- 검증: `npm run typecheck`, `npm run verify` 통과
