ALTER TABLE board_posts
ADD COLUMN IF NOT EXISTS moderation_status varchar(16);

ALTER TABLE board_posts
ADD COLUMN IF NOT EXISTS moderation_held_reason text;

ALTER TABLE board_posts
ADD COLUMN IF NOT EXISTS moderation_checked_at timestamptz;

UPDATE board_posts
SET moderation_status = 'visible'
WHERE moderation_status IS NULL;

UPDATE board_posts
SET moderation_held_reason = NULL
WHERE moderation_status <> 'held';

ALTER TABLE board_posts
ALTER COLUMN moderation_status SET DEFAULT 'unchecked';

ALTER TABLE board_posts
ALTER COLUMN moderation_status SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_board_posts_moderation_status'
    ) THEN
        ALTER TABLE board_posts
        ADD CONSTRAINT chk_board_posts_moderation_status
        CHECK (moderation_status IN ('unchecked', 'visible', 'held'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_board_posts_moderation_status
ON board_posts (moderation_status);

CREATE INDEX IF NOT EXISTS idx_board_posts_moderation_status_checked_at
ON board_posts (moderation_status, moderation_checked_at);
