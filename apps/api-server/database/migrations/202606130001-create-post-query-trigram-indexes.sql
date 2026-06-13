CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$
BEGIN
    IF to_regclass('posts') IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
                AND table_name = 'posts'
                AND column_name = 'title'
        ) THEN
        CREATE INDEX IF NOT EXISTS idx_posts_title_trgm
        ON posts USING gin (title gin_trgm_ops);
    END IF;

    IF to_regclass('posts') IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
                AND table_name = 'posts'
                AND column_name = 'content'
        ) THEN
        CREATE INDEX IF NOT EXISTS idx_posts_content_trgm
        ON posts USING gin (content gin_trgm_ops);
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('tags') IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
                AND table_name = 'tags'
                AND column_name = 'name'
        ) THEN
        CREATE INDEX IF NOT EXISTS idx_tags_name_trgm
        ON tags USING gin (name gin_trgm_ops);
    END IF;
END $$;
