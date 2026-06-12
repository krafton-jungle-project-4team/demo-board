# 프롬프트 하네스

날짜: 2026-06-12

## 목적

생성 가이드가 실제 작업 프롬프트로 쓰일 때도 규칙, 스킬, 폴더 문맥이 유지되는지 검증한다.

검증은 2단계로 나눈다.

1. 생성 에이전트가 가이드만 보고 starter를 만든다.
2. 다른 기능 에이전트가 생성된 프로젝트에서 단순한 기능 프롬프트만 받고 작업한다.

기능 에이전트에게 DB, TypeORM, SQL, Zod, 스킬 이름을 직접 지시하지 않는다. 이 규칙은 생성된 프로젝트의 `AGENTS.md`, 문서, 스킬 지정이 끌고 가야 한다.

## 산출물

생성 프로젝트는 다음 파일을 남긴다.

```text
docs/generation/commands.md
docs/generation/result.md
docs/generation/prompt.md
docs/generation/skill-usage.md
docs/generation/feature-prompt.md
docs/generation/feature-task-result.md
```

## 필수 AGENTS.md

생성 프로젝트는 폴더별 문맥을 둔다.

```text
AGENTS.md
apps/web-client/AGENTS.md
apps/api-server/AGENTS.md
packages/shared/AGENTS.md
packages/ui/AGENTS.md
docs/AGENTS.md
.codex/skills/AGENTS.md
```

각 파일은 해당 폴더에서 지킬 import 경계, 구현 위치, 검증 명령, 스킬 사용 조건을 20줄 안팎으로 적는다.

## 스킬 지정

작업 프롬프트는 work type별 필수 스킬을 명시한다.

| 작업                           | 필수 스킬                                                   |
| ------------------------------ | ----------------------------------------------------------- |
| React/UI 코드 작성, 수정, 리뷰 | `toss-frontend-fundamentals`, `vercel-react-best-practices` |
| 컴포넌트 API 설계              | `vercel-composition-patterns`                               |
| UI/UX/accessibility 검토       | `web-design-guidelines`                                     |
| 문서 작성/압축                 | `writing-guidelines`                                        |

`docs/generation/skill-usage.md`에는 다음을 기록한다.

```md
# Skill Usage

## Planned

- 작업 유형:
- 적용할 스킬:
- 제외한 스킬과 이유:

## Applied

- 스킬:
- 적용한 파일/결정:
- 바꾼 점:

## React Doctor

- 실행 결과 또는 실행 불가 사유:
```

## 1단계: 생성 하네스

생성 에이전트는 starter만 만든다. 생성 단계에서 `bookmarks` 기능을 구현하지 않는다.

필수:

- v4 가이드 준수
- 폴더별 `AGENTS.md` 생성
- `.codex/skills`에 스킬 안내 생성
- `docs/generation/prompt.md`에 생성 프롬프트 기록
- `docs/generation/result.md`에 생성 결과 기록
- `docs/generation/commands.md`에 실행 명령 기록
- `npm run verify`

## 2단계: 단순 기능 프롬프트 하네스

기능 에이전트는 생성된 프로젝트만 읽는다. 원본 저장소와 생성 가이드는 읽지 않는다.

기능 프롬프트는 아래 수준으로 짧아야 한다.

```md
bookmarks 기능을 추가해줘. 로그인한 사용자가 URL과 제목을 저장하고, 내 목록을 보고, 삭제할 수 있으면 돼. 기존 프로젝트 규칙대로 검증까지 해줘.
```

기능 작업 결과는 현재 프로젝트 품질과 같은 기준을 만족해야 한다. 기본 테스트 도메인은 `bookmarks`다.

필수 범위:

- shared Zod contract
- SQL schema와 dummy data
- TypeORM entity
- API controller/query service/command service
- Web route/page/feature API/query hook/UI
- `@project/ui/components` primitive 우선 사용
- 세션 기반 write guard
- `npm run verify`
- `docs/generation/feature-prompt.md`에 실제 단순 프롬프트 기록
- `docs/generation/feature-task-result.md`에 결과와 검증 기록

금지:

- in-memory store
- shared contract 없이 API 객체 정의
- Web에서 API 서버 import
- skill usage 기록 누락
- 폴더별 AGENTS.md 누락
- 기능 프롬프트에 DB/TypeORM/SQL/Zod/스킬 상세 지시 포함

## 검증

하네스 검증은 다음을 모두 확인한다.

- `npm run verify` 통과
- 금지 grep 통과
- AGENTS.md 파일 존재
- skill usage 로그 존재
- feature prompt가 짧고 세부 아키텍처를 직접 지시하지 않음
- 새 도메인이 shared/API/Web/SQL에 모두 반영
- React Doctor 결과 또는 불가 사유 기록

## 생성 에이전트 프롬프트 템플릿

```md
너는 독립 프로젝트 생성 에이전트다.

읽을 파일:

- <생성 가이드>
- <프롬프트 하네스>

원본 저장소의 다른 파일은 읽거나 복사하지 마라.

출력 디렉터리:
<출력 경로>

작업:

1. 생성 가이드로 starter를 만든다.
2. 폴더별 AGENTS.md를 만든다.
3. `.codex/skills`에 스킬 사용 안내를 만든다.
4. commands/result/prompt를 기록한다.
5. 자체 grep과 `npm run verify`를 실행한다.

최종 응답:

- 생성 경로
- AGENTS.md 생성 여부
- grep 결과
- `npm run verify` 결과
- 미구현/불확실 항목
```

## 기능 에이전트 프롬프트 템플릿

```md
작업 디렉터리:
<생성 프로젝트 경로>

원본 저장소와 생성 가이드는 읽지 마라. 이 프로젝트 안의 `AGENTS.md`, 문서, `.codex/skills`만 문맥으로 사용해라.

아래 사용자 프롬프트만 기능 요구사항으로 취급한다.

사용자 프롬프트:
bookmarks 기능을 추가해줘. 로그인한 사용자가 URL과 제목을 저장하고, 내 목록을 보고, 삭제할 수 있으면 돼. 기존 프로젝트 규칙대로 검증까지 해줘.

추가 기록:

- 실제 사용자 프롬프트를 `docs/generation/feature-prompt.md`에 기록한다.
- 사용한 스킬과 이유를 `docs/generation/skill-usage.md`에 추가한다.
- 작업 결과와 검증을 `docs/generation/feature-task-result.md`에 기록한다.

최종 응답:

- 구현 요약
- 참조한 AGENTS.md/스킬 문맥
- `npm run verify` 결과
- 미구현/불확실 항목
```
