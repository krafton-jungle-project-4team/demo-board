# FE 코드 규칙 정렬

날짜: 2026-06-09

## 이유

005에서 정한 FE 구조 규칙에 맞춰 게시판 화면을 계속 개발하기 위해서다.
특히 page는 화면 조립, feature는 도메인 API hook과 UI를 담당해야 하며, 게시글 생성/수정은 008 요구처럼 modal이 아니라 page route여야 한다.

## 작업

- 기준 커밋: `97a22be`
- 완료 커밋: 이 메모가 포함된 커밋
- 게시글 작성 dialog와 수정 dialog를 제거했다.
- `/posts/new`, `/posts/$postId/edit` route와 page를 추가했다.
- `posts_.new`, `posts_.$postId_.edit` 파일명으로 page route가 부모 route에 nested되지 않게 했다.
- 목록, 카드, 상세 화면의 작성/수정 진입점을 dialog trigger에서 route link로 바꿨다.
- 목록과 카드에서 별도 상세 버튼을 제거하고 제목 링크를 상세 이동 경로로 유지했다.
- 삭제 액션은 목록/카드/상세가 아니라 수정 페이지에서 선택하게 옮겼다.
- `PostForm`을 dialog 전용 footer에 의존하지 않는 page 공용 form으로 바꿨다.
- auth 가입 완료 API 호출을 page에서 `features/auth` hook으로 옮겼다.
- 현재 사용자 조회 query를 `features/auth`에 추가하고, 루트 header에 현재 사용자 이름을 표시했다.
- `/me` route와 본인 정보 수정 page를 추가했다.
- header의 사용자 이름을 `/me` 링크로 바꿨다.
- OAuth 신규 사용자는 GitHub `login`을 앱 이름으로 자동 사용하지 않고 `name: null`, `PENDING`으로 둔다.
- 이름이 없는 PENDING 사용자는 header와 `/me`에서 가입 완료로 이동시킨다.
- `/me`에서 로그아웃을 수행하고 current user cache를 비운다.
- web build 전에 TanStack route tree를 생성하도록 `routes:generate`와 `prebuild`를 추가했다.
- 게시글 상태 필드를 API contract와 FE 화면에서 제거했다.
- 다른 사용자의 게시글에는 수정 진입점을 보이지 않게 했다.
- 게시글 상세/목록/수정 page는 권한 있음/없음처럼 같이 실행되지 않는 UI를 별도 컴포넌트로 나눴다.
- BE의 게시글 수정/삭제는 기존 `assertOwner` 검증을 유지해 작성자 또는 관리자만 통과하게 했다.
- shadcn/ui 생성 컴포넌트와 전역 CSS는 수정하지 않았다.

## 결과

- 게시글 CRUD의 C/U가 page 기반 흐름으로 바뀌었다.
- `/posts/new`, `/posts/$postId/edit`가 root 하위 독립 route로 생성되어 부모 page의 `<Outlet />` 없이도 이동된다.
- page가 generated API를 직접 호출하지 않고 feature hook을 통해 mutation을 수행한다.
- 게시글은 제목, 요약, 본문, 태그 중심의 단순 text CRUD로 남는다.
- 기존 URL 상태 기반 목록 조회와 상세 조회 흐름은 유지된다.
- 로그인된 사용자는 header에서 자기 이름을 보고 `/me`로 이동해 이름을 수정할 수 있다.
- PENDING 사용자는 로그인 완료 사용자처럼 표시되지 않고 가입 완료 후 ACTIVE가 된다.
- 로그인된 사용자는 `/me`에서 로그아웃할 수 있다.
- 삭제는 수정 페이지에서 수행된다.
- 작성자가 아닌 사용자는 FE에서 게시글 수정 버튼을 볼 수 없고, 직접 API를 호출해도 BE에서 403을 받는다.
- 수정 권한이 없는 사용자가 `/posts/$postId/edit`로 직접 진입하면 읽기 전용 안내 화면만 본다.
- `npm run build -w @nmm/web-client`와 `npm run verify`가 통과했다.
