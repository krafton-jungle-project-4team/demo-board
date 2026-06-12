# 반복 기록

날짜: 2026-06-12

## v1

- 가이드: `docs/project-generator-guide/v1-guide.md`
- 생성 위치: `/tmp/nmm-guide-eval-v1-a`, `/tmp/nmm-guide-eval-v1-b`
- 생성 에이전트: `019eb74c-5344-7e43-94a7-9e6ced07c08f`, `019eb74c-7765-7220-811a-92757aebbeab`
- 초기화 명령 기록:
    - `/tmp/nmm-guide-eval-v1-a/docs/generation/commands.md`
    - `/tmp/nmm-guide-eval-v1-b/docs/generation/commands.md`
- 검증 명령: 두 생성 결과 모두 `npm run verify` 통과
- 보조 정적 점수:
    - v1-a: 107/135
    - v1-b: 106/135
- 판정: 약 79%. 90% 기준 미달.
- 주요 차이:
    - 두 결과 모두 SQL script와 TypeORM entity는 만들었지만 API CRUD가 DB-backed가 아니라 in-memory store를 사용했다.
    - 두 결과 모두 루트 `compose.yml`을 만들지 않았다.
    - Web env 파일이 현재 기준의 `apps/web-client/.env.example` 위치와 다르거나 누락됐다.
    - Web HTTP client 파일명이 현재 기준의 `shared/api/http-client.ts`와 달랐다.
    - auth service가 `auth-query.service.ts`와 `auth-command.service.ts`로 분리되지 않았다.
    - v1-a는 shadcn CLI가 standalone `packages/ui`에서 framework 감지 실패 후 수동 primitive로 대체했다.
    - v1-a는 `packages/ui/src/styles/globals.css`와 Radix dependency가 기준과 달랐다.
    - v1-b는 `board-store.ts`와 auth user 배열을 사용했다.
- 다음 수정:
    - v2는 모든 샘플 API가 TypeORM repository/DataSource로 SQL schema를 실제 사용해야 한다고 명시한다.
    - in-memory store, array, Map 기반 API 구현을 금지한다.
    - 루트 `compose.yml`, env 파일 위치, HTTP client 파일명, auth query/command service 파일명을 필수 산출물로 고정한다.
    - shadcn/ui는 web app에서 CLI init을 수행한 뒤 UI 패키지로 primitive를 정리하는 fallback 순서를 제시한다.

## v2

- 가이드: `docs/project-generator-guide/v2-guide.md`
- 생성 위치: `/tmp/nmm-guide-eval-v2-a`, `/tmp/nmm-guide-eval-v2-b`
- 생성 에이전트: `019eb762-b250-7623-acde-b0cf70ba4bf4`, `019eb762-e7a4-7643-8c15-185ed6ba0811`
- 초기화 명령 기록:
    - `/tmp/nmm-guide-eval-v2-a/docs/generation/commands.md`
    - `/tmp/nmm-guide-eval-v2-b/docs/generation/commands.md`
- 검증 명령:
    - 서브 에이전트가 두 결과 모두 `npm run verify` 통과 확인
    - 본 작업자가 두 결과에서 `npm run verify` 재실행 통과 확인
- grep 점검:
    - 금지 패턴 `board-store|Post[] =|UserRecord[]|new Map`: 두 결과 모두 match 없음
    - board service `InjectRepository|DataSource`: 두 결과 모두 확인
    - auth service `InjectRepository`: 두 결과 모두 확인
    - `synchronize: false`: v2-a 확인, v2-b는 정적 평가에서 확인
- 보조 정적 점수:
    - v2-a: 134/135
    - v2-b: 131/135
- 판정: 97% 이상. 90% 기준 충족.
- 주요 차이:
    - v2-a는 UI dependency가 현재 기준의 aggregate `radix-ui` 대신 `@radix-ui/*` 개별 패키지다.
    - v2-b는 UI primitive 구현을 개별 파일 대신 `components.ts` 중심으로 모았다.
    - 두 결과 모두 OAuth/password 로그인 provider는 stub 경계로 남겼다. 단, 세션 검증과 current user 처리는 DB-backed다.
    - Docker Compose runtime, curl smoke, web preview는 생성 에이전트가 실행하지 않았다.
- 다음 수정:
    - 90% 기준을 넘겼으므로 의미를 유지하는 범위에서 가이드를 압축한다.
    - 압축 가이드는 80% 이상 유지되는지 별도 생성으로 검증한다.

## v3

- 가이드: `docs/project-generator-guide/v3-compact-guide.md`
- 압축: v2 513줄 -> v3 247줄
- 생성 위치: `/tmp/nmm-guide-eval-v3-a`
- 생성 에이전트: `019eb773-5feb-77d3-bf7b-48322b687518`
- 초기화 명령 기록: `/tmp/nmm-guide-eval-v3-a/docs/generation/commands.md`
- 검증 명령:
    - 서브 에이전트가 `npm run verify` 통과 확인
    - 본 작업자가 `/tmp/nmm-guide-eval-v3-a`에서 `npm run verify` 재실행 통과 확인
- grep 점검:
    - 금지 패턴 `board-store|Post[] =|UserRecord[]|new Map`: match 없음
    - board service `InjectRepository|DataSource`: 확인
    - auth service `InjectRepository`: 확인
    - `synchronize: false`: 확인
- 보조 정적 점수: 130/135
- 판정: 약 96%. 압축 후 80% 기준 충족.
- 주요 차이:
    - `DomainError` 이름 대신 동등한 error envelope 구현을 사용했다.
    - app provider/root 폴더가 현재 기준보다 단순하다.
    - TanStack Router는 code-based 구성으로 구현했지만 Router 의존성과 route 기능은 유지했다.
    - OAuth provider는 stub으로 대체했지만 세션/current user는 DB-backed다.
- 다음 수정:
    - 더 줄일 수 있는 반복 설명을 제거한 v4 최소판을 검증한다.

## v4

- 가이드: `docs/project-generator-guide/v4-minimal-guide.md`
- 압축: v2 513줄 -> v4 223줄
- 생성 위치: `/tmp/nmm-guide-eval-v4-a`
- 생성 에이전트: `019eb786-be79-7bd0-9899-4f536a8666d7`
- 초기화 명령 기록: `/tmp/nmm-guide-eval-v4-a/docs/generation/commands.md`
- 검증 명령:
    - 서브 에이전트가 `npm run verify` 통과 확인
    - 본 작업자가 `/tmp/nmm-guide-eval-v4-a`에서 `npm run verify` 재실행 통과 확인
- grep 점검:
    - 금지 패턴 `board-store|Post[] =|UserRecord[]|new Map`: match 없음
    - board service `InjectRepository|DataSource`: 확인
    - auth service `InjectRepository`: 확인
    - `synchronize: false`: 확인
- 보조 정적 점수: 129/135
- 판정: 약 96%. 압축 후 80% 기준 충족.
- 주요 차이:
    - `apps/web-client/.env.example`이 보조 스크립트 기준에서 누락됐다.
    - `DomainError` 이름 대신 동등한 error envelope 구현을 사용했다.
    - app provider/root 폴더가 현재 기준보다 단순하다.
    - shadcn CLI는 실패했고 `packages/ui` primitive API를 직접 정리했다.
    - OAuth provider는 stub으로 대체했지만 세션/current user는 DB-backed다.
- 다음 수정:
    - v4를 최종 최소 가이드로 채택한다.

## v5 하네스

- 가이드: `docs/project-generator-guide/v4-minimal-guide.md`, `docs/project-generator-guide/prompt-harness.md`
- 생성 위치: `/tmp/nmm-guide-eval-v5-project-a`
- 생성 에이전트: `019eb7b1-8c26-7911-932b-2b91bd181707`
- 기능 에이전트: `019eb7c9-c826-7e42-81d4-076c3e86c864`
- 목적:
    - 먼저 starter만 생성한다.
    - 그 다음 단순 `bookmarks` 기능 프롬프트만으로 기능 개발을 수행한다.
    - 폴더별 `AGENTS.md`와 스킬 문맥이 실제 작업 품질을 유지시키는지 확인한다.
- 초기화 명령 기록: `/tmp/nmm-guide-eval-v5-project-a/docs/generation/commands.md`
- 기능 프롬프트 기록: `/tmp/nmm-guide-eval-v5-project-a/docs/generation/feature-prompt.md`
- 기능 결과 기록: `/tmp/nmm-guide-eval-v5-project-a/docs/generation/feature-task-result.md`
- 검증 명령:
    - 생성 에이전트가 `npm run verify` 통과 확인
    - 기능 에이전트가 기능 추가 후 `npm run verify` 통과 확인
    - 본 작업자가 기능 추가 후 `/tmp/nmm-guide-eval-v5-project-a`에서 `npm run verify` 재실행 통과 확인
    - 기능 에이전트가 root script `npm run dev:web -- -- --host 127.0.0.1 --port 5173`로 `/bookmarks` 200 응답 확인
- grep 점검:
    - 생성 직후 `apps`/`packages` 코드에 `bookmark(s)` 없음
    - 기능 추가 후 `apps/*/src`, `packages/*/src`에서 금지 패턴 `board-store|Post[] =|UserRecord[]|new Map` match 없음
    - 기능 추가 후 `bookmarks` shared contract, SQL, API feature, Web feature 확인
- 생성 하네스 점수:
    - 생성 직후: 151/157
    - 기능 추가 후: `bookmarks` 존재 때문에 `--generation-harness`의 no-feature 항목은 실패하는 것이 정상
- 하네스 점수: 기능 추가 후 192/198
- 판정: 통과. 단순 기능 프롬프트만으로도 폴더별 `AGENTS.md`, `.codex/skills`, 기존 코드 문맥을 따라 DB-backed API, SQL-first schema, shared contract, HTTP-only Web, UI primitive 우선 규칙이 유지됐다.
- 주요 차이:
    - `apps/web-client/.env.example`이 보조 스크립트 기준에서 누락됐다.
    - `DomainError` 이름 대신 `AppError` 계열 구현을 사용했다.
    - UI dependency가 현재 기준의 aggregate `radix-ui` 대신 개별 Radix dependency다.
    - app provider/root가 폴더가 아니라 파일 중심이다.
    - Docker API 서버를 띄운 실제 세션 CRUD smoke는 수행하지 않았다.
    - Vite build에서 500KB chunk warning이 있었지만 build exit code는 0이다.
- 다음 수정:
    - v5 하네스는 목표를 충족하므로 채택한다.
    - 다음 반복이 필요하면 Docker 기반 API smoke와 `.env.example` 위치를 필수 점검으로 올린다.
