# Web Client 지침

## 범위

- `apps/web-client`에 적용한다.
- 이 앱은 workspace 코드 중 `@nmm/shared`, `@nmm/ui`만 import한다.
- API는 feature/shared API function을 통해 HTTP로만 호출한다.

## 구조

- `app`: root app wiring, router, provider, root route UI.
- `app/providers`: 전역 provider만 둔다.
- `app/root`: root route 전용 header, fallback, pending UI만 둔다.
- `routes`: TanStack Router file route와 search 검증만 둔다.
- `pages`: route-level 화면 조합.
- `features/<domain>`: `api`, `model`, `hooks`, `ui`, `lib`, `index.ts`.
- `features/<domain>/ui`: 해당 feature 전용 UI 조합만 둔다.
- feature `index.ts`는 page에서 써도 되는 공개 API만 export한다.
- `shared`: HTTP client, env 같은 web 전용 공통 유틸.

## UI

- Control과 primitive는 raw HTML보다 `@nmm/ui/components`를 먼저 쓴다.
- App 전용 조합은 page/feature 코드에 둔다.
- `@nmm/ui/lib/*`를 import하거나 별도 `cn`을 만들지 않는다.
- 조회 pending은 Suspense fallback에 위임한다.
- 조회 error는 가장 가까운 ErrorBoundary가 잡는다.
- Mutation pending은 이벤트 UI에서 직접 다룬다.
- JSX 안에서는 익명 함수식을 직접 만들지 않는다.
- 이벤트 콜백은 가능하면 `handle*` 이름의 함수로 분리한다.

## API

- Web은 shared Zod schema로 표준 응답 envelope를 파싱하는 수동 typed HTTP 함수를 쓴다.
- TanStack Query option/hook은 feature 코드에 둔다.
- API 계약이 바뀌면 shared contract, API 서버 controller, Web HTTP 함수를 같은 작업 단위로 갱신한다.

## 스킬

- shadcn 공식 예시의 import/path는 이 앱 구조에 맞게 `@nmm/ui/components`로 해석한다.
- `shadcn` skill과 충돌하면 이 파일의 앱 경계, import, UI, 검증 규칙을 우선한다.
- React/UI 코드는 `toss-frontend-fundamentals`, `vercel-react-best-practices`를 적용한다.
- Component API 설계에는 `vercel-composition-patterns`를 적용한다.
- UX/accessibility review에는 `web-design-guidelines`를 적용한다.

## 확인

- 변경 후 루트 `npm run verify`를 실행한다.
- API server를 직접 실행하지 말고 루트 script만 쓴다.
