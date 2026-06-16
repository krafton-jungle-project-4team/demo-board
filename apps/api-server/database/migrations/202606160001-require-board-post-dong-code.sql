DELETE FROM board_post_tags
WHERE post_id IN (
    SELECT id
    FROM board_posts
    WHERE dong_code IS NULL
);

DELETE FROM board_comments
WHERE post_id IN (
    SELECT id
    FROM board_posts
    WHERE dong_code IS NULL
);

DELETE FROM board_posts
WHERE dong_code IS NULL;

ALTER TABLE board_posts
ALTER COLUMN dong_code SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_board_posts_dong_code
ON board_posts (dong_code);
