# api-server 폴더 구조 규칙

날짜: 2026-06-09

## 이유

`apps/api-server/src`의 컨트롤러, 서비스, DTO, 더미 저장소가 루트와 service에 섞여 있어 다음 BE 작업 전 기능 기준 구조가 필요했다.

## 작업

- 관련 커밋: 이 메모가 포함된 커밋
- `temp.md`의 규칙을 기준으로 `auth`, `board`, `health` feature 폴더를 만들었다.
- 각 feature에 module과 공개 `index.ts`를 추가하고, `AppModule`은 feature module만 import하게 했다.
- `auth`는 controller/service/database로 나누고, 세션/사용자/OAuth state 더미 저장소를 `AuthRepository`로 옮겼다.
- `board`는 controller/service/database로 나누고, 게시글/댓글/태그 더미 저장소를 `BoardRepository`로 옮겼다.
- `health`는 로직이 없어 controller와 module만 두었다.
- `posts.dto.ts`를 auth용 `auth.dto.ts`와 board용 `board.dto.ts`로 분리했다.
- feature 간 import는 `features/auth/index.ts`처럼 공개 index를 통하게 했다.
- 구조 기준 문서였던 `temp.md`는 제거했다.

## 결과

- API 서버 루트에는 `main.ts`, `app.module.ts`, `openapi.ts`, `env.ts`만 남는다.
- service는 요청 검증, 권한, 매핑을 담당하고 더미 데이터 상태는 repository가 가진다.
- OpenAPI spec과 FE generated client를 새 구조 기준으로 재생성했다.
- 검증: `npm run typecheck -w @nmm/api-server`, `npm run openapi:generate`, `npm run verify` 통과
