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
    (3, 'boilerplate')
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
    (3, 3)
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
