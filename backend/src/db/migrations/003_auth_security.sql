-- Existing sessions without a CSRF hash remain unusable until explicitly
-- rotated by the authentication service. No session data is backfilled.
ALTER TABLE auth_sessions
    ADD COLUMN csrf_token_hash text,
    ADD CONSTRAINT auth_sessions_csrf_token_hash_format_ck
        CHECK (
            csrf_token_hash IS NULL
            OR csrf_token_hash ~ '^[0-9a-f]{64}$'
        );

CREATE UNIQUE INDEX auth_sessions_csrf_token_hash_uq
    ON auth_sessions (csrf_token_hash)
    WHERE csrf_token_hash IS NOT NULL;

-- Buckets cover account and client-IP limits without storing either value.
CREATE TABLE auth_login_rate_limits (
    bucket_hash text PRIMARY KEY
        CHECK (bucket_hash ~ '^[0-9a-f]{64}$'),
    window_started_at timestamptz NOT NULL,
    attempt_count integer NOT NULL
        CHECK (attempt_count > 0),
    expires_at timestamptz NOT NULL,
    CHECK (expires_at > window_started_at)
);

CREATE INDEX auth_login_rate_limits_expires_idx
    ON auth_login_rate_limits (expires_at);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM users
        WHERE role = 'admin'
          AND (password_hash IS NULL OR btrim(password_hash) = '')
    ) THEN
        RAISE EXCEPTION
            'Migration 003 cannot require administrator password hashes: an existing administrator has no usable password hash. Review and provision the account explicitly, then retry.';
    END IF;
END
$$;

ALTER TABLE users
    ADD CONSTRAINT users_admin_password_hash_ck
        CHECK (
            role <> 'admin'
            OR (password_hash IS NOT NULL AND btrim(password_hash) <> '')
        );
