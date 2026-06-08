# 프론트/공통 스택 보일러플레이트

날짜: 2026-06-08

## 이유

002의 Vite/Nest/shared 골격, 003의 검증 체계, 004의 TSConfig 기준 위에서 바로 개발 가능한 게시판 보일러플레이트를 만들기 위해서다.
게시판 기능 자체보다 라우터, 서버 상태, URL 상태, UI 컴포넌트, API 계약 생성 흐름을 실제 코드로 검증하는 것이 목표다.

## 설계 회의 요약

- 백엔드 실구현은 제외하되 Nest 더미 CRUD API는 OpenAPI 계약 제공자로 둔다.
- 라우터는 파일 기반 TanStack Router와 Vite plugin을 쓴다.
- 서버 상태는 TanStack Query가 맡고 query key는 URL 상태를 포함한다.
- URL 상태는 `q`, `page`, `sort`, `view`만 둔다.
- URL에는 token, PII, draft, 대용량, 휘발성 UI 상태를 넣지 않는다.
- URL 상태 검증은 nuqs parser와 TanStack Router `validateSearch`를 함께 쓴다.
- nuqs는 공식 TanStack Router adapter를 사용한다.
- UI는 shadcn/ui 컴포넌트와 Tailwind layout/spacing 유틸리티 중심으로 둔다.
- 화면 전용 CSS는 만들지 않고 shadcn/Tailwind 전역 token만 둔다.
- shadcn/ui 컴포넌트는 벤더 코드처럼 두고 직접 수정하지 않는다.
- shadcn/ui CLI 대상과 생성 컴포넌트는 `packages/ui`로 격리한다.
- web 구조는 `routes`, `pages`, `features/<domain>`로 나눈다.
- OpenAPI spec이 있으면 Orval로 fetch 함수와 타입을 생성한다.
- TanStack Query hook은 generated 코드가 아니라 feature 코드에서 직접 작성한다.
- 인증 같은 공통 HTTP 처리가 필요해질 때만 Orval custom mutator를 추가한다.
- API 외부 입력은 shared zod schema로 검증한다.

## 작업

- 기준 커밋: `9b16632`
- 완료 커밋: 이 메모가 포함된 커밋
- `packages/shared`에 post zod 계약을 추가했다.
- `apps/api-server`에 posts 더미 CRUD, Swagger DTO, OpenAPI emit 스크립트를 추가했다.
- `openapi/api-server.json`을 생성했다.
- `apps/web-client`에 TanStack Router, TanStack Query, nuqs, shadcn/ui, Tailwind, Orval을 도입했다.
- shadcn/ui 컴포넌트와 `cn`을 `packages/ui`로 옮기고 앱의 `components.json`을 제거했다.
- 앱은 `@nmm/ui/components`와 `@nmm/ui/styles/globals.css`를 사용한다.
- `features/posts`를 `api`, `model`, `hooks`, `ui`, `index.ts`로 분리했다.
- 라우트 연결 화면은 `pages/posts`로 옮겼다.
- 작성/수정 dialog를 분리하고 공통 form은 `PostForm`으로 뺐다.
- 폼 값은 별도 wrapper 타입/변환 함수 없이 shared `CreatePostRequest`를 사용한다.
- query key는 목록 무효화용 `listPrefix`, 파라미터별 `list(params)`, 상세 `detail(id)`로 나눴다.
- 조회 query는 Suspense 기반으로 바꾸고 루트에 pending fallback을 추가했다.
- 루트 라우트 범위의 넓은 `AppErrorBoundary`와 route error fallback을 추가했다.
- Orval generated fetch client를 추가하고 별도 fetch wrapper는 제거했다.
- posts feature에 직접 작성한 TanStack Query hook과 query key를 추가했다.
- `/posts` 목록은 `q/page/sort/view` URL 상태와 query hook을 연결했다.
- `/posts/$postId` 상세, 작성/수정 dialog, 삭제 mutation을 추가했다.
- TanStack route tree와 Orval generated client는 생성물로 lint/format 예외 처리했다.
- Prettier 줄바꿈 기준을 120자로 바꿨다.
- `docs/project-standards.md`에 API 계약 생성 규칙을 추가했다.

## 결과

- 더미 API는 검색 옵션에 따라 결과를 바꾸지 않지만, 실제 API가 구현되면 CRUD 화면 흐름이 유지된다.
- `npm run openapi:generate`로 spec과 generated fetch client/type을 재생성할 수 있다.
- 자동 포맷은 120자 기준으로 동작한다.
- shadcn/ui 생성물은 앱 코드가 아니라 UI 패키지 내부 구현으로 분리됐다.
- 라우트, page 조립, 도메인 기능의 책임이 분리됐다.
- `npm run verify`가 통과했다.

## 참고

- https://tanstack.com/router/v1/docs/framework/react/routing/file-based-routing
- https://nuqs.dev/docs/adapters
- https://ui.shadcn.com/docs/installation/vite
- https://ui.shadcn.com/docs/monorepo
- https://orval.dev/reference/configuration/output
