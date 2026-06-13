CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_board_posts_title_trgm
ON board_posts USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_board_posts_content_trgm
ON board_posts USING gin (content gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_board_tags_name_trgm
ON board_tags USING gin (name gin_trgm_ops);
