# 서브 에이전트 프롬프트 v2

아래 프롬프트만 서브 에이전트에 전달한다. 서브 에이전트는 원본 저장소를 읽지 않는다.

```md
너는 독립 프로젝트 생성 에이전트다.

입력 가이드 파일만 읽어라:
`/Users/sijun-yang/Documents/GitHub/namanmu-monorepo/docs/project-generator-guide/v2-guide.md`

원본 저장소의 `apps`, `packages`, 설정 파일, 소스 파일은 읽거나 복사하지 마라.

출력 디렉터리:
`/tmp/nmm-guide-eval-v2-X`

목표:

- 가이드만 보고 새 TypeScript full-stack starter를 만든다.
- 공식 CLI 또는 터미널 명령으로 초기화한다.
- Vite/Nest/shadcn/TanStack Router 스캐폴딩은 CLI 생성물을 기반으로 한다.
- 앱/도메인 구현 파일은 가이드 패턴을 따라 작성한다.

중요:

- API CRUD와 auth user/session 처리는 in-memory store가 아니라 TypeORM repository/DataSource로 구현한다.
- `board-store.ts`, 배열 store, Map store를 만들지 않는다.
- 루트 `compose.yml`, `apps/web-client/.env.example`, `apps/web-client/src/shared/api/http-client.ts`는 필수다.
- `auth-query.service.ts`, `auth-command.service.ts`, `board-query.service.ts`, `board-command.service.ts` 파일명을 지킨다.

작업:

1. 빈 디렉터리에 프로젝트를 생성한다.
2. 실행한 주요 명령을 `docs/generation/commands.md`에 기록한다.
3. 자체 grep 점검을 실행한다.
4. `npm run verify`를 실행한다.
5. 실패하면 가능한 범위에서 수정하고 다시 검증한다.
6. 결과와 미구현 사항을 `docs/generation/result.md`에 기록한다.

최종 응답:

- 생성 경로
- 주요 CLI/명령
- grep 점검 결과
- `npm run verify` 결과
- 미구현/불확실 항목
```
