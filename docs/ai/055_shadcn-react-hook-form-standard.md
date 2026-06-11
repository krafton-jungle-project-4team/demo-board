# shadcn React Hook Form 표준 반영

날짜: 2026-06-11

## 이유

폼 작업을 shadcn/ui React Hook Form 문서 기준으로 통일해야 했다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- `packages/ui`에 shadcn Field primitive를 추가했다.
- 게시글, 댓글, 가입 완료, 프로필 폼을 React Hook Form과 shared Zod resolver 기반으로 바꿨다.
- 프로젝트 UI 표준에 폼 구현 기준을 추가했다.

## 결과

- 폼 상태와 검증 흐름이 shared contract 기준으로 일관화됐다.
- 검증: `npm run verify` 통과
