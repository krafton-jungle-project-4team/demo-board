# Web Client Vercel React 정리

날짜: 2026-06-11

## 이유

Vercel React Best Practices 기준으로 web-client의 bundle, rerender, JavaScript 성능 후보를 정리했다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- `lucide-react`, `@nmm/ui/components`, feature index barrel import를 직접 import로 바꿨다.
- 빈 배열 fallback과 반복 tag lookup을 안정화했다.
- 날짜 formatter와 sort 값 lookup을 모듈 상수로 옮겼다.

## 결과

- 정적 스캔에서 대상 barrel import, `?? []`, `toLocaleString`, `FieldError errors={[...]}` 패턴이 남지 않았다.
- 검증: `npm run verify` 통과
