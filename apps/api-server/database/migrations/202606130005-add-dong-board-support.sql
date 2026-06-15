CREATE TABLE IF NOT EXISTS board_songpa_dongs (
    code varchar(5) PRIMARY KEY,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO board_songpa_dongs (code, name)
VALUES
    ('10100', '잠실동'),
    ('10200', '신천동'),
    ('10300', '풍납동'),
    ('10400', '송파동'),
    ('10500', '석촌동'),
    ('10600', '삼전동'),
    ('10700', '가락동'),
    ('10800', '문정동'),
    ('10900', '장지동'),
    ('11100', '방이동'),
    ('11200', '오금동'),
    ('11300', '거여동'),
    ('11400', '마천동')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name;

ALTER TABLE auth_users
ADD COLUMN IF NOT EXISTS residence_dong_code varchar(5);

ALTER TABLE board_posts
ADD COLUMN IF NOT EXISTS dong_code varchar(5);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_auth_users_residence_dong_code'
    ) THEN
        ALTER TABLE auth_users
        ADD CONSTRAINT fk_auth_users_residence_dong_code
        FOREIGN KEY (residence_dong_code) REFERENCES board_songpa_dongs (code);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_board_posts_dong_code'
    ) THEN
        ALTER TABLE board_posts
        ADD CONSTRAINT fk_board_posts_dong_code
        FOREIGN KEY (dong_code) REFERENCES board_songpa_dongs (code);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_auth_users_residence_dong_code
ON auth_users (residence_dong_code);
