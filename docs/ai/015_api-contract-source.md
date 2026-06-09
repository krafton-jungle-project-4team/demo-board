# API 계약 원본 정리

날짜: 2026-06-09

## 이유

Nest 서버는 Zod로 입력을 검증하므로 OpenAPI decorator를 API 계약이나 검증 기준처럼 설명하면 기준이 흐려진다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- `docs/project-standards.md`의 API 계약 기준을 shared Zod schema 중심으로 수정했다.
- OpenAPI는 내부 FE 요청 함수 생성용 산출물로 정리했다.
- `@ApiProperty`, `@ApiPropertyOptional`은 필요한 경우만 쓰며 검증 기준이 아니라고 명시했다.
- generated DTO 타입보다 shared contract를 API 객체 형식 원본으로 우선하도록 적었다.

## 결과

- 검증: `npm run verify` 통과
- 후속 작업: 기존 OpenAPI decorator와 generated DTO 타입 의존은 요청 함수 생성에 불필요한 것부터 줄인다.
