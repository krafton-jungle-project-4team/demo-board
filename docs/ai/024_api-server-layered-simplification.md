# API 서버 레이어드 구조 단순화

날짜: 2026-06-10

## 이유

서버를 추상화 중심 구조가 아니라 단순한 레이어드 구조로 맞춘다. repository interface, domain error, domain 폴더는 현재 요구에 비해 간접 계층이 많았다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- repository interface와 repository 구현체 레이어를 제거했다.
- service가 TypeORM repository/DataSource를 직접 주입받게 했다.
- TypeORM entity를 `database`로 옮기고 `domain` 폴더를 제거했다.
- API 앱 에러를 `app-errors.ts` 한 곳에 모으고 HTTP exception filter가 해당 payload를 표준 에러 envelope로 변환하게 했다.
- 프로젝트 표준을 새 서버 구조에 맞게 갱신했다.

## 결과

- API 서버 feature는 `controller`, `service`, `database` 구조를 따른다.
- query/command service 분리는 유지하되 DB 접근은 service가 직접 수행한다.
- JSON 응답 형식은 기존 표준 envelope를 유지한다.
- 검증: `npm run verify` 통과
