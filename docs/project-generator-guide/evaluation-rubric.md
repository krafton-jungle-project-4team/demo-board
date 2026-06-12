# 평가 기준

날짜: 2026-06-12

## 목적

가이드만 보고 생성한 프로젝트가 현재 코드베이스를 기능적, 구조적으로 얼마나 재현했는지 평가한다.

## 점수

총점은 100점이다.

| 항목                                 | 점수 |
| ------------------------------------ | ---: |
| 기능 요구사항 일치도                 |   25 |
| 파일 및 디렉터리 구조 유사도         |   20 |
| 주요 컴포넌트, 모듈, API 설계 유사도 |   20 |
| 의존성 및 빌드 방식 일치도           |   15 |
| 테스트 또는 실행 결과 동등성         |   10 |
| 반복 생성 안정성                     |   10 |

## 90% 판정

다음 조건을 모두 만족하면 상세 가이드 반복을 중단한다.

- 총점 90점 이상
- 인증, SQL-first DB, shared contract, API envelope, 루트 `verify` 중 어느 것도 0점이 아님
- 생성 프로젝트가 `npm run verify` 또는 동등한 루트 검증 명령을 통과함
- 서브 에이전트가 공식 CLI 또는 터미널 명령으로 초기화한 기록을 남김

## 압축 후 80% 판정

가이드를 간결하게 압축한 뒤 다음 조건을 모두 만족해야 한다.

- 총점 80점 이상
- 세션 기반 사용자 처리 유지
- SQL script가 DB 스키마 원본으로 유지
- 루트 `verify` 유지
- Codex skill 기반 FE 품질 루프 유지

## 항목별 채점

### 기능 요구사항 일치도 25점

- 세션 기반 current user/AuthClaims 흐름: 5
- 로그인 provider 교체 가능성: 2
- 게시글 CRUD: 4
- 댓글 CRUD: 3
- 태그 목록/연결: 2
- shared Zod contract 기반 request/response 검증: 3
- 표준 response envelope와 request id: 3
- Docker Compose Postgres 개발 환경: 2
- Codex skill/React Doctor FE 개선 루프: 1

### 파일 및 디렉터리 구조 유사도 20점

- `apps/web-client`, `apps/api-server`, `packages/shared`, `packages/ui`: 4
- API `core`, `infra`, `features` 구조: 4
- API feature의 `controller`, `service`, `database`: 3
- Web `app`, `routes`, `pages`, `features`, `shared`: 4
- Web feature의 `api`, `model`, `hooks`, `ui`, `index.ts`: 2
- `docs/ai`와 `.codex/skills`: 2
- SQL script 위치: 1

### 주요 설계 유사도 20점

- controller가 shared schema로 경계 검증: 3
- service가 schema 값 대신 contract type 사용: 2
- query/command service 분리: 2
- TypeORM entity의 DB 정규화/API 변환 메서드: 2
- guard/decorator 인증 경계: 3
- Web typed HTTP client가 envelope를 파싱: 3
- TanStack Router file routes와 search 검증: 2
- React Query hook을 feature에 직접 작성: 2
- UI primitive 우선 사용: 1

### 의존성 및 빌드 방식 일치도 15점

- npm workspaces와 file workspace dependency: 2
- Vite React TS: 2
- Nest API: 2
- Zod/tsup shared package: 2
- shadcn/Radix/lucide/Tailwind UI package: 2
- TanStack Router/Query, ky, React Hook Form: 2
- TypeORM/Postgres/nestjs-pino: 2
- Husky/lint-staged/ESLint/Prettier 루트 검증: 1

### 테스트 또는 실행 결과 동등성 10점

- `npm run verify` 통과: 4
- `/api/health` 응답 가능: 1
- 게시글 목록 API 응답 envelope 확인: 1
- Web build 또는 preview 가능: 2
- DB init/dummy SQL 적용 가능: 2

### 반복 생성 안정성 10점

- 같은 가이드로 2회 생성 시 총점 편차 5점 이하: 4
- 필수 구조 누락 없음: 2
- 생성 명령 로그가 일관됨: 2
- 직접 복사 흔적 없음: 2

## 비교 기록 형식

각 반복은 `iterations.md`에 다음 형식으로 기록한다.

```md
## vN

- 가이드: `vN-guide.md`
- 생성 위치:
- 생성 에이전트:
- 초기화 명령 기록:
- 검증 명령:
- 점수:
- 주요 차이:
- 다음 수정:
```

## 보조 평가 명령

정적 구조 점수는 다음 명령으로 확인한다.

```bash
python3 scripts/evaluate-generated-project.py /tmp/nmm-guide-eval-v1-a
```

이 명령은 구조, 의존성, 핵심 파일 존재 여부만 본다. 최종 점수에는 `npm run verify`, API/Web smoke check, 2회 생성 안정성 결과를 함께 반영한다.

프롬프트 하네스, 폴더별 `AGENTS.md`, 스킬 사용 로그, 특정 도메인 작업까지 확인할 때는 다음 명령을 쓴다.

```bash
python3 scripts/evaluate-generated-project.py /tmp/nmm-guide-eval-v5-project-a --generation-harness
python3 scripts/evaluate-generated-project.py /tmp/nmm-guide-eval-v5-project-a --harness
```

하네스 점수는 생성 후 실제 작업이 현재 프로젝트 규칙을 계속 지키는지 보는 별도 게이트다.
