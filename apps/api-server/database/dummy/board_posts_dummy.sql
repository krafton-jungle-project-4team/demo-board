WITH seed_dongs AS (
    SELECT code, name
    FROM board_songpa_dongs
)
INSERT INTO auth_user (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
SELECT
    concat('board-seed-', code),
    concat(name, ' 이웃'),
    concat('board-seed-', code, '@example.local'),
    true,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM seed_dongs
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    email = EXCLUDED.email,
    "emailVerified" = true,
    "updatedAt" = CURRENT_TIMESTAMP;

WITH seed_dongs AS (
    SELECT code, name
    FROM board_songpa_dongs
)
INSERT INTO auth_users (auth_user_id, email, name, residence_dong_code)
SELECT
    concat('board-seed-', code),
    concat('board-seed-', code, '@example.local'),
    concat(name, ' 이웃'),
    code
FROM seed_dongs
ON CONFLICT (auth_user_id) DO UPDATE
SET email = EXCLUDED.email,
    name = EXCLUDED.name,
    residence_dong_code = EXCLUDED.residence_dong_code,
    updated_at = CURRENT_TIMESTAMP;

WITH seed_tags(name) AS (
    VALUES
        ('공지'),
        ('질문'),
        ('정보공유'),
        ('생활'),
        ('맛집'),
        ('거래'),
        ('동네생활')
    UNION
    SELECT name
    FROM board_songpa_dongs
)
INSERT INTO board_tags (name, normalized_name)
SELECT name, lower(name)
FROM seed_tags
ON CONFLICT (normalized_name) DO UPDATE
SET name = EXCLUDED.name;

WITH seed_posts AS (
    SELECT
        dongs.code AS dong_code,
        dongs.name AS dong_name,
        post_numbers.post_number,
        auth_users.id AS author_id,
        concat(
            '[',
            dongs.name,
            '] ',
            CASE (post_numbers.post_number - 1) % 10
                WHEN 0 THEN '동네 소식 공유'
                WHEN 1 THEN '생활 정보 묻습니다'
                WHEN 2 THEN '주변 시설 후기'
                WHEN 3 THEN '같이 확인해요'
                WHEN 4 THEN '주말 일정 나눔'
                WHEN 5 THEN '맛집 추천 받아요'
                WHEN 6 THEN '분실물 찾습니다'
                WHEN 7 THEN '이웃 거래 안내'
                WHEN 8 THEN '교통 상황 공유'
                ELSE '동네 질문 있어요'
            END,
            ' #',
            lpad(post_numbers.post_number::text, 2, '0')
        ) AS title,
        concat(
            dongs.name,
            ' 기본 게시판 테스트 게시물입니다.',
            chr(10),
            chr(10),
            '목데이터 확인을 위해 동 이름, 순번, 태그 검색에 걸릴 문구를 포함했습니다. ',
            '이 게시물은 ',
            dongs.name,
            ' ',
            post_numbers.post_number,
            '번째 글입니다.'
        ) AS content,
        TIMESTAMPTZ '2026-06-17 09:00:00+09'
            - ((row_number() OVER (ORDER BY dongs.code, post_numbers.post_number) - 1) * INTERVAL '7 minutes')
            AS created_at
    FROM board_songpa_dongs dongs
    JOIN auth_users
        ON auth_users.auth_user_id = concat('board-seed-', dongs.code)
    CROSS JOIN generate_series(1, 30) AS post_numbers(post_number)
)
INSERT INTO board_posts (
    author_id,
    dong_code,
    title,
    content,
    moderation_status,
    moderation_checked_at,
    created_at,
    updated_at
)
SELECT
    author_id,
    dong_code,
    title,
    content,
    'visible',
    created_at,
    created_at,
    created_at
FROM seed_posts
WHERE NOT EXISTS (
    SELECT 1
    FROM board_posts
    WHERE board_posts.dong_code = seed_posts.dong_code
        AND board_posts.title = seed_posts.title
);

WITH seed_posts AS (
    SELECT
        dongs.code AS dong_code,
        dongs.name AS dong_name,
        post_numbers.post_number,
        concat(
            '[',
            dongs.name,
            '] ',
            CASE (post_numbers.post_number - 1) % 10
                WHEN 0 THEN '동네 소식 공유'
                WHEN 1 THEN '생활 정보 묻습니다'
                WHEN 2 THEN '주변 시설 후기'
                WHEN 3 THEN '같이 확인해요'
                WHEN 4 THEN '주말 일정 나눔'
                WHEN 5 THEN '맛집 추천 받아요'
                WHEN 6 THEN '분실물 찾습니다'
                WHEN 7 THEN '이웃 거래 안내'
                WHEN 8 THEN '교통 상황 공유'
                ELSE '동네 질문 있어요'
            END,
            ' #',
            lpad(post_numbers.post_number::text, 2, '0')
        ) AS title,
        CASE (post_numbers.post_number - 1) % 6
            WHEN 0 THEN '공지'
            WHEN 1 THEN '질문'
            WHEN 2 THEN '정보공유'
            WHEN 3 THEN '생활'
            WHEN 4 THEN '맛집'
            ELSE '거래'
        END AS category_tag_name
    FROM board_songpa_dongs dongs
    CROSS JOIN generate_series(1, 30) AS post_numbers(post_number)
),
seed_post_ids AS (
    SELECT
        board_posts.id AS post_id,
        seed_posts.dong_name,
        seed_posts.category_tag_name
    FROM seed_posts
    JOIN board_posts
        ON board_posts.dong_code = seed_posts.dong_code
        AND board_posts.title = seed_posts.title
),
seed_post_tag_names AS (
    SELECT post_id, dong_name AS tag_name
    FROM seed_post_ids
    UNION ALL
    SELECT post_id, category_tag_name
    FROM seed_post_ids
    UNION ALL
    SELECT post_id, '동네생활'
    FROM seed_post_ids
)
INSERT INTO board_post_tags (post_id, tag_id)
SELECT seed_post_tag_names.post_id, board_tags.id
FROM seed_post_tag_names
JOIN board_tags
    ON board_tags.normalized_name = lower(seed_post_tag_names.tag_name)
ON CONFLICT (post_id, tag_id) DO NOTHING;
