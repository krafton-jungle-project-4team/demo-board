# Zod 기반 OpenAPI schema 전환

날짜: 2026-06-09

## 이유

API 계약 원본은 shared Zod schema인데 Nest DTO와 `@ApiProperty` 메타데이터를 별도로 유지하면 계약이 중복된다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- API 서버에 Zod schema를 OpenAPI schema로 바꾸는 helper를 추가했다.
- 표준 성공/에러 응답 OpenAPI schema도 class DTO 대신 schema 객체로 만들었다.
- auth, board, health controller의 `@ApiProperty` 기반 DTO class를 제거했다.
- controller 입력 타입은 DTO 대신 `unknown`으로 받고 service가 shared Zod schema로 검증하게 유지했다.
- web feature/page/ui 타입은 generated DTO 대신 `@nmm/shared` contract 타입을 사용하게 했다.
- OpenAPI spec과 Orval generated client를 재생성했다.

## 결과

- API 서버 소스에서 `ApiProperty`, `ApiPropertyOptional`, `*.dto.ts`를 제거했다.
- OpenAPI는 내부 요청 함수 생성용 schema만 제공하고, min/max/pattern 같은 검증성 키는 제거한다.
- 검증: `npm run openapi:generate`, `npm run verify` 통과
- 후속 작업: generated client의 에러 타입 중복은 필요하면 Orval 설정으로 줄인다.
