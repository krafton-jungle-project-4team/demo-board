# 템플릿 정리

날짜: 2026-06-12

## 이유

프로젝트를 도메인 구현보다 구조 중심 템플릿으로 쓰기 위해 정리했다.

## 작업

- 이 메모가 포함된 커밋: 게시판, 인증, 기존 docs를 제거했다.
- API와 Web은 TypeORM 기반 `example` 더미만 남겼다.
- `better-auth`, `typeorm`, `react-query` 의존성은 유지했다.
- 기존 프로젝트 표준은 관련 `AGENTS.md`로 옮겼다.

## 결과

- 검증: `python3 scripts/evaluate-generated-project.py . --harness --generation-harness`, `npm run verify` 통과.
