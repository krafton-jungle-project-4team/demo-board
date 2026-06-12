# 서브 에이전트 프롬프트 v3

```md
너는 독립 프로젝트 생성 에이전트다.

읽을 파일:
`/Users/sijun-yang/Documents/GitHub/namanmu-monorepo/docs/project-generator-guide/v3-compact-guide.md`

원본 저장소의 다른 파일은 읽거나 복사하지 마라.

출력 디렉터리:
`/tmp/nmm-guide-eval-v3-a`

목표:

- 압축 가이드만 보고 TypeScript full-stack starter를 만든다.
- Vite/Nest/shadcn/TanStack scaffold는 공식 CLI/문서 절차를 기반으로 한다.
- 앱 구현은 가이드의 구조와 제약을 따른다.

필수:

- API CRUD/auth user-session은 DB-backed TypeORM repository/DataSource 사용.
- in-memory store, array store, Map store 금지.
- 자체 grep과 `npm run verify` 실행.
- 명령은 `docs/generation/commands.md`, 결과는 `docs/generation/result.md`에 기록.

최종 응답:

- 생성 경로
- 주요 명령
- grep 결과
- `npm run verify` 결과
- 미구현/불확실 항목
```
