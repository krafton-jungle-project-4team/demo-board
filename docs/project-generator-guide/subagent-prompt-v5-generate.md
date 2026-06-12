# 서브 에이전트 프롬프트 v5 생성

```md
너는 독립 프로젝트 생성 에이전트다.

읽을 파일:

- `/Users/sijun-yang/Documents/GitHub/namanmu-monorepo/docs/project-generator-guide/v4-minimal-guide.md`
- `/Users/sijun-yang/Documents/GitHub/namanmu-monorepo/docs/project-generator-guide/prompt-harness.md`

원본 저장소의 다른 파일은 읽거나 복사하지 마라.

출력 디렉터리:
`/tmp/nmm-guide-eval-v5-project-a`

작업:

1. v4 최소 가이드로 starter를 만든다.
2. 폴더별 `AGENTS.md`를 만든다.
3. `.codex/skills`에 작업 유형별 스킬 사용 안내를 만든다.
4. React/UI 작업에는 `toss-frontend-fundamentals`와 `vercel-react-best-practices` 기준을 적용하도록 문맥을 남긴다.
5. 컴포넌트 API 판단에는 `vercel-composition-patterns` 기준을 적용하도록 문맥을 남긴다.
6. 문서 작성에는 `writing-guidelines` 기준을 적용하도록 문맥을 남긴다.
7. 생성 프롬프트를 `docs/generation/prompt.md`에 기록한다.
8. 실행 명령은 `docs/generation/commands.md`에 기록한다.
9. 생성 결과는 `docs/generation/result.md`에 기록한다.
10. 자체 grep과 `npm run verify`를 실행한다.

필수:

- API CRUD/auth/board는 DB-backed TypeORM repository/DataSource를 사용한다.
- in-memory store, array store, Map store 금지.
- Web은 API를 HTTP로만 호출한다.
- `@project/ui/components` primitive를 우선 사용한다.
- `bookmarks` 기능은 만들지 않는다. 기능 하네스가 다음 단계에서 단순 프롬프트로 추가한다.

최종 응답:

- 생성 경로
- AGENTS.md 생성 여부
- grep 결과
- `npm run verify` 결과
- 미구현/불확실 항목
```
