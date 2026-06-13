CREATE TABLE IF NOT EXISTS auth_user (
    id text PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    "emailVerified" boolean NOT NULL DEFAULT false,
    image text,
    "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_session (
    id text PRIMARY KEY,
    "expiresAt" timestamptz NOT NULL,
    token text NOT NULL UNIQUE,
    "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" text,
    "userAgent" text,
    "userId" text NOT NULL REFERENCES auth_user (id)
);

CREATE INDEX IF NOT EXISTS auth_session_userId_idx ON auth_session ("userId");

CREATE TABLE IF NOT EXISTS auth_account (
    id text PRIMARY KEY,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" text NOT NULL REFERENCES auth_user (id),
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamptz,
    "refreshTokenExpiresAt" timestamptz,
    scope text,
    password text,
    "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS auth_account_userId_idx ON auth_account ("userId");

CREATE TABLE IF NOT EXISTS auth_verification (
    id text PRIMARY KEY,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamptz NOT NULL,
    "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS auth_verification_identifier_idx ON auth_verification (identifier);

CREATE TABLE IF NOT EXISTS auth_users (
    id bigserial PRIMARY KEY,
    auth_user_id text NOT NULL UNIQUE REFERENCES auth_user (id),
    email text NOT NULL UNIQUE,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS example_items (
    id bigserial PRIMARY KEY,
    message text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO auth_user (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
VALUES ('system', 'System', 'system@example.local', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_users (auth_user_id, email, name)
VALUES ('system', 'system@example.local', 'System')
ON CONFLICT (auth_user_id) DO UPDATE
SET email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = CURRENT_TIMESTAMP;

DO $$
BEGIN
    IF to_regclass('app_users') IS NOT NULL THEN
        EXECUTE '
            INSERT INTO auth_users (auth_user_id, email, name, created_at, updated_at)
            SELECT auth_user_id, email, name, created_at, updated_at
            FROM app_users
            ON CONFLICT (auth_user_id) DO UPDATE
            SET email = EXCLUDED.email,
                name = EXCLUDED.name,
                updated_at = EXCLUDED.updated_at
        ';
    END IF;
END $$;
