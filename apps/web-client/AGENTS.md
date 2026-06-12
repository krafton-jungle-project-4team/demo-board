# Web Client 지침

## 범위

- `apps/web-client`에 적용한다.
- 이 앱은 workspace 코드 중 `@nmm/shared`, `@nmm/ui`만 import한다.
- API는 feature/shared API function을 통해 HTTP로만 호출한다.

## 구조

- `app`: root app wiring, router, provider, root route UI.
- `routes`: TanStack Router file route와 search 검증만 둔다.
- `pages`: route-level 화면 조합.
- `features/<domain>`: `api`, `model`, `hooks`, `ui`, `lib`, `index.ts`.
- `shared`: HTTP client, env 같은 web 전용 공통 유틸.

## UI

- Control과 primitive는 raw HTML보다 `@nmm/ui/components`를 먼저 쓴다.
- App 전용 조합은 page/feature 코드에 둔다.
- `@nmm/ui/lib/*`를 import하거나 별도 `cn`을 만들지 않는다.

## 스킬

- React/UI 코드는 `toss-frontend-fundamentals`, `vercel-react-best-practices`를 적용한다.
- Component API 설계에는 `vercel-composition-patterns`를 적용한다.
- UX/accessibility review에는 `web-design-guidelines`를 적용한다.

## 확인

- 변경 후 루트 `npm run verify`를 실행한다.
- API server를 직접 실행하지 말고 루트 script만 쓴다.
