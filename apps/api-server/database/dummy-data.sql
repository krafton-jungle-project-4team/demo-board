INSERT INTO "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", role, status)
VALUES
    (
        'user-sijun',
        'sijun',
        'sijun@example.com',
        true,
        NULL,
        '2026-06-09T00:00:00.000Z',
        '2026-06-09T00:00:00.000Z',
        'USER',
        'ACTIVE'
    )
ON CONFLICT (id) DO UPDATE
SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    "emailVerified" = EXCLUDED."emailVerified",
    image = EXCLUDED.image,
    "updatedAt" = EXCLUDED."updatedAt",
    role = EXCLUDED.role,
    status = EXCLUDED.status;

INSERT INTO post_tags (id, name)
VALUES
    (1, 'react'),
    (2, 'nest'),
    (3, 'boilerplate'),
    (4, 'typescript'),
    (5, 'auth'),
    (6, 'database')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name;

INSERT INTO posts (id, title, excerpt, content, author_id, created_at, updated_at)
VALUES
    (
        1,
        '프론트 공통 스택 결정',
        '라우터, 서버 상태, URL 상태를 분리해 보일러플레이트의 기준을 잡는다.',
        'TanStack Router, TanStack Query, nuqs, shadcn/ui를 연결해 게시판 CRUD 화면의 개발 출발점을 만든다.',
        'user-sijun',
        '2026-06-09T00:00:00.000Z',
        '2026-06-09T00:00:00.000Z'
    ),
    (
        2,
        'Shared contract API 연결',
        'shared Zod schema로 API 요청과 응답 계약을 공유한다.',
        'FE는 작은 fetch 함수를 직접 작성하고, BE와 같은 schema로 응답 데이터를 검증한다.',
        'user-sijun',
        '2026-06-09T00:10:00.000Z',
        '2026-06-09T00:10:00.000Z'
    ),
    (
        3,
        'URL 상태 규칙',
        '검색어, 페이지, 정렬, 보기 방식은 공유 가능한 URL 상태로 둔다.',
        'draft, token, PII, 대용량 데이터, 휘발성 UI 상태는 URL에 넣지 않는다.',
        'user-sijun',
        '2026-06-09T00:20:00.000Z',
        '2026-06-09T00:20:00.000Z'
    ),
    (
        4,
        'API 응답 envelope 정리',
        '성공과 실패 응답을 같은 모양으로 맞춰 클라이언트 처리를 단순하게 만든다.',
        '성공 응답은 requestId와 data를 담고, 실패 응답은 requestId와 error 객체를 담는다.',
        'user-sijun',
        '2026-06-09T00:30:00.000Z',
        '2026-06-09T00:30:00.000Z'
    ),
    (
        5,
        '인증 세션 경계',
        'controller는 cookie를 직접 읽지 않고 guard가 세션 검증 결과만 전달한다.',
        'AuthClaims에는 userId, sessionId, role, status만 담아 API 경계를 작게 유지한다.',
        'user-sijun',
        '2026-06-09T00:40:00.000Z',
        '2026-06-09T00:40:00.000Z'
    ),
    (
        6,
        '게시글 작성 권한',
        '활성 사용자만 게시글과 댓글을 작성할 수 있게 guard를 분리한다.',
        'ACTIVE 상태가 아닌 사용자는 읽기만 가능하고 변경 API는 403으로 응답한다.',
        'user-sijun',
        '2026-06-09T00:50:00.000Z',
        '2026-06-09T00:50:00.000Z'
    ),
    (
        7,
        'DB 초기화 스크립트',
        '로컬 개발 DB는 스키마와 더미 데이터를 SQL 파일로 명시한다.',
        'init-db.sql은 테이블을 다시 만들고 dummy-data.sql은 화면 확인에 필요한 데이터를 채운다.',
        'user-sijun',
        '2026-06-09T01:00:00.000Z',
        '2026-06-09T01:00:00.000Z'
    ),
    (
        8,
        '서비스별 debug 로그',
        '주요 service method 진입 지점에 debug 로그를 남겨 API 흐름을 추적한다.',
        'requestId가 포함된 로그로 한 요청 안에서 어떤 service가 호출됐는지 확인할 수 있다.',
        'user-sijun',
        '2026-06-09T01:10:00.000Z',
        '2026-06-09T01:10:00.000Z'
    ),
    (
        9,
        'Nest logger context',
        '서비스별 Logger context를 사용해 로그 출처를 명확히 한다.',
        'nestjs-pino와 Nest Logger를 연결해 구조화 로그와 context를 함께 남긴다.',
        'user-sijun',
        '2026-06-09T01:20:00.000Z',
        '2026-06-09T01:20:00.000Z'
    ),
    (
        10,
        'OAuth redirect 설정',
        'GitHub OAuth callback은 API가 받고 최종 화면 이동은 Web URL로 돌려보낸다.',
        'provider callback, 성공 callback, 에러 callback을 구분해 로컬 포트가 섞이지 않게 한다.',
        'user-sijun',
        '2026-06-09T01:30:00.000Z',
        '2026-06-09T01:30:00.000Z'
    ),
    (
        11,
        'Web auth API origin',
        '분리된 Web/API 구조에서 auth client가 API origin을 명시하게 한다.',
        'VITE_NMM_API_ORIGIN으로 Better Auth client baseURL을 설정하고 로컬/운영 값을 분리한다.',
        'user-sijun',
        '2026-06-09T01:40:00.000Z',
        '2026-06-09T01:40:00.000Z'
    ),
    (
        12,
        'TypeORM entity 변환',
        'DB 값과 API 응답 값 변환을 entity method로 모은다.',
        'service는 조회와 권한 판단에 집중하고 객체 모양 변환은 entity가 담당한다.',
        'user-sijun',
        '2026-06-09T01:50:00.000Z',
        '2026-06-09T01:50:00.000Z'
    ),
    (
        13,
        '게시글 검색 필터',
        '제목, 요약, 내용, 작성자, 태그 이름을 대상으로 검색어 필터를 적용한다.',
        '검색 결과에도 동일한 정렬과 페이지네이션 규칙을 적용한다.',
        'user-sijun',
        '2026-06-09T02:00:00.000Z',
        '2026-06-09T02:00:00.000Z'
    ),
    (
        14,
        '페이지네이션 확인 데이터',
        '기본 pageSize에서도 두 번째 페이지가 보이도록 게시글 수를 충분히 둔다.',
        'created-desc 정렬에서 첫 페이지와 다음 페이지가 다르게 보이는지 확인한다.',
        'user-sijun',
        '2026-06-09T02:10:00.000Z',
        '2026-06-09T02:10:00.000Z'
    ),
    (
        15,
        '테이블 보기 데이터',
        '목록 화면의 테이블 보기에서 긴 제목과 태그 조합이 깨지지 않는지 확인한다.',
        '반복 데이터 대신 실제 기능 이름을 담은 더미 게시글로 화면을 검증한다.',
        'user-sijun',
        '2026-06-09T02:20:00.000Z',
        '2026-06-09T02:20:00.000Z'
    )
ON CONFLICT (id) DO UPDATE
SET
    title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    content = EXCLUDED.content,
    author_id = EXCLUDED.author_id,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;

INSERT INTO post_tag_links (post_id, tag_id)
VALUES
    (1, 1),
    (1, 3),
    (2, 2),
    (2, 3),
    (3, 3),
    (3, 4),
    (4, 2),
    (4, 4),
    (5, 5),
    (6, 5),
    (7, 6),
    (8, 2),
    (9, 2),
    (10, 5),
    (11, 1),
    (11, 5),
    (12, 2),
    (12, 6),
    (13, 3),
    (14, 3),
    (15, 1),
    (15, 3)
ON CONFLICT (post_id, tag_id) DO NOTHING;

INSERT INTO comments (id, post_id, content, author_id, created_at, updated_at)
VALUES
    (
        1,
        1,
        '보일러플레이트 기준을 확인하기 위한 댓글 예시입니다.',
        'user-sijun',
        '2026-06-09T00:30:00.000Z',
        '2026-06-09T00:30:00.000Z'
    ),
    (
        2,
        7,
        'DB를 다시 만들었을 때 더미 데이터가 안정적으로 들어가는지 확인합니다.',
        'user-sijun',
        '2026-06-09T01:05:00.000Z',
        '2026-06-09T01:05:00.000Z'
    ),
    (
        3,
        10,
        'OAuth callback URL은 API와 Web origin을 구분해서 봐야 합니다.',
        'user-sijun',
        '2026-06-09T01:35:00.000Z',
        '2026-06-09T01:35:00.000Z'
    ),
    (
        4,
        15,
        '페이지가 넘어가도 댓글 수와 상세 화면이 자연스럽게 보여야 합니다.',
        'user-sijun',
        '2026-06-09T02:25:00.000Z',
        '2026-06-09T02:25:00.000Z'
    )
ON CONFLICT (id) DO UPDATE
SET
    post_id = EXCLUDED.post_id,
    content = EXCLUDED.content,
    author_id = EXCLUDED.author_id,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;

SELECT setval(pg_get_serial_sequence('post_tags', 'id'), (SELECT MAX(id) FROM post_tags));
SELECT setval(pg_get_serial_sequence('posts', 'id'), (SELECT MAX(id) FROM posts));
SELECT setval(pg_get_serial_sequence('comments', 'id'), (SELECT MAX(id) FROM comments));
