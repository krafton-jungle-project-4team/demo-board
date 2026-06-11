# Shadcn 우선 UI 정리

날짜: 2026-06-11

## 이유

작은 UI와 카드형/상태형 markup이 shadcn 기반 primitive를 우선 사용해야 한다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- `Separator` primitive를 `packages/ui`에 추가했다.
- 댓글, 테이블, fallback, 상태 메시지 UI를 `Card`, `Badge`, `Separator` 기반으로 정리했다.
- shadcn 대체 primitive가 없는 본문/레이아웃 의미 태그는 유지했다.

## 결과

- `npm run verify` 통과
