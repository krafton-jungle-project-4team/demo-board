CREATE TABLE IF NOT EXISTS board_posts (
    id bigserial PRIMARY KEY,
    author_id bigint NOT NULL REFERENCES auth_users (id),
    title text NOT NULL,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_board_posts_author_id ON board_posts (author_id);

CREATE TABLE IF NOT EXISTS board_tags (
    id bigserial PRIMARY KEY,
    name varchar(30) NOT NULL,
    normalized_name varchar(30) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_board_tags_normalized_name_unique ON board_tags (normalized_name);

CREATE TABLE IF NOT EXISTS board_post_tags (
    id bigserial PRIMARY KEY,
    post_id bigint NOT NULL REFERENCES board_posts (id),
    tag_id bigint NOT NULL REFERENCES board_tags (id),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_board_post_tags_post_id ON board_post_tags (post_id);
CREATE INDEX IF NOT EXISTS idx_board_post_tags_tag_id ON board_post_tags (tag_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_board_post_tags_post_id_tag_id_unique ON board_post_tags (post_id, tag_id);

CREATE TABLE IF NOT EXISTS board_comments (
    id bigserial PRIMARY KEY,
    post_id bigint NOT NULL REFERENCES board_posts (id),
    author_id bigint NOT NULL REFERENCES auth_users (id),
    parent_comment_id bigint REFERENCES board_comments (id),
    depth int NOT NULL,
    content text NOT NULL,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_board_comments_post_id_parent_comment_id ON board_comments (post_id, parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_board_comments_author_id ON board_comments (author_id);

DO $$
BEGIN
    IF to_regclass('posts') IS NOT NULL THEN
        EXECUTE '
            INSERT INTO board_posts (id, author_id, title, content, created_at, updated_at)
            SELECT
                id,
                (SELECT id FROM auth_users WHERE auth_user_id = ''system''),
                title,
                content,
                created_at,
                updated_at
            FROM posts
            ON CONFLICT (id) DO NOTHING
        ';
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('post_tags') IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
                AND table_name = 'post_tags'
                AND column_name = 'normalized_name'
        ) THEN
        EXECUTE '
            INSERT INTO board_tags (id, name, normalized_name, created_at)
            SELECT id, name, normalized_name, created_at
            FROM post_tags
            ON CONFLICT (id) DO NOTHING
        ';
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('tags') IS NOT NULL THEN
        EXECUTE '
            INSERT INTO board_tags (name, normalized_name)
            SELECT name, lower(name)
            FROM tags
            ON CONFLICT (normalized_name) DO NOTHING
        ';
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('post_tag_assignments') IS NOT NULL THEN
        EXECUTE '
            INSERT INTO board_post_tags (id, post_id, tag_id, created_at)
            SELECT id, post_id, post_tag_id, created_at
            FROM post_tag_assignments
            WHERE EXISTS (SELECT 1 FROM board_posts WHERE board_posts.id = post_tag_assignments.post_id)
                AND EXISTS (SELECT 1 FROM board_tags WHERE board_tags.id = post_tag_assignments.post_tag_id)
            ON CONFLICT (id) DO NOTHING
        ';
    END IF;
END $$;

DO $$
DECLARE
    post_id_column text;
    parent_comment_id_column text;
    deleted_at_column text;
    created_at_column text;
    updated_at_column text;
    depth_column text;
    parent_comment_id_expression text;
    deleted_at_expression text;
    created_at_expression text;
    updated_at_expression text;
    depth_expression text;
BEGIN
    IF to_regclass('comments') IS NOT NULL THEN
        SELECT column_name
        INTO post_id_column
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'comments'
            AND column_name IN ('post_id', 'postId')
        ORDER BY CASE column_name WHEN 'post_id' THEN 1 ELSE 2 END
        LIMIT 1;

        IF post_id_column IS NULL THEN
            RAISE NOTICE 'Skipping legacy comments migration because post id column was not found.';
            RETURN;
        END IF;

        SELECT column_name
        INTO parent_comment_id_column
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'comments'
            AND column_name IN ('parent_comment_id', 'parentCommentId')
        ORDER BY CASE column_name WHEN 'parent_comment_id' THEN 1 ELSE 2 END
        LIMIT 1;

        SELECT column_name
        INTO deleted_at_column
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'comments'
            AND column_name IN ('deleted_at', 'deletedAt')
        ORDER BY CASE column_name WHEN 'deleted_at' THEN 1 ELSE 2 END
        LIMIT 1;

        SELECT column_name
        INTO depth_column
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'comments'
            AND column_name = 'depth'
        LIMIT 1;

        SELECT column_name
        INTO created_at_column
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'comments'
            AND column_name IN ('created_at', 'createdAt')
        ORDER BY CASE column_name WHEN 'created_at' THEN 1 ELSE 2 END
        LIMIT 1;

        SELECT column_name
        INTO updated_at_column
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'comments'
            AND column_name IN ('updated_at', 'updatedAt')
        ORDER BY CASE column_name WHEN 'updated_at' THEN 1 ELSE 2 END
        LIMIT 1;

        parent_comment_id_expression := CASE
            WHEN parent_comment_id_column IS NULL THEN 'NULL::bigint'
            ELSE format('%I', parent_comment_id_column)
        END;
        deleted_at_expression := CASE
            WHEN deleted_at_column IS NULL THEN 'NULL::timestamptz'
            ELSE format('%I', deleted_at_column)
        END;
        created_at_expression := CASE
            WHEN created_at_column IS NULL THEN 'CURRENT_TIMESTAMP'
            ELSE format('%I', created_at_column)
        END;
        updated_at_expression := CASE
            WHEN updated_at_column IS NULL THEN 'CURRENT_TIMESTAMP'
            ELSE format('%I', updated_at_column)
        END;
        depth_expression := CASE
            WHEN depth_column IS NULL THEN '0'
            ELSE format('%I', depth_column)
        END;

        EXECUTE format(
            '
            INSERT INTO board_comments (
                id,
                post_id,
                author_id,
                parent_comment_id,
                depth,
                content,
                deleted_at,
                created_at,
                updated_at
            )
            SELECT
                id,
                %1$I,
                (SELECT id FROM auth_users WHERE auth_user_id = ''system''),
                %2$s,
                %6$s,
                content,
                %3$s,
                %4$s,
                %5$s
            FROM comments
            WHERE EXISTS (SELECT 1 FROM board_posts WHERE board_posts.id = comments.%1$I)
            ON CONFLICT (id) DO NOTHING
        ',
            post_id_column,
            parent_comment_id_expression,
            deleted_at_expression,
            created_at_expression,
            updated_at_expression,
            depth_expression
        );
    END IF;
END $$;

SELECT setval(pg_get_serial_sequence('board_posts', 'id'), GREATEST(COALESCE(MAX(id), 1), 1), COALESCE(MAX(id), 0) > 0)
FROM board_posts;

SELECT setval(pg_get_serial_sequence('board_tags', 'id'), GREATEST(COALESCE(MAX(id), 1), 1), COALESCE(MAX(id), 0) > 0)
FROM board_tags;

SELECT setval(
    pg_get_serial_sequence('board_post_tags', 'id'),
    GREATEST(COALESCE(MAX(id), 1), 1),
    COALESCE(MAX(id), 0) > 0
)
FROM board_post_tags;

SELECT setval(
    pg_get_serial_sequence('board_comments', 'id'),
    GREATEST(COALESCE(MAX(id), 1), 1),
    COALESCE(MAX(id), 0) > 0
)
FROM board_comments;
