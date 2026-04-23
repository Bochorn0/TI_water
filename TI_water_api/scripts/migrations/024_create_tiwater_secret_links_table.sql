-- Password-protected encrypted secret links (internal sharing via tiwater.mx/e/:slug)
-- Run after products/quotes; uses tiwater pool (POSTGRES_TIWATER_DB / same as auth DB in production).

CREATE TABLE IF NOT EXISTS tiwater_secret_links (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(500) DEFAULT NULL,
    password_hash TEXT NOT NULL,
    kdf_salt BYTEA NOT NULL,
    iv BYTEA NOT NULL,
    ciphertext BYTEA NOT NULL,
    auth_tag BYTEA NOT NULL,
    created_by INTEGER DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_tiwater_secret_links_slug ON tiwater_secret_links (slug);
CREATE INDEX IF NOT EXISTS idx_tiwater_secret_links_created_at ON tiwater_secret_links (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tiwater_secret_links_expires_at ON tiwater_secret_links (expires_at);

COMMENT ON TABLE tiwater_secret_links IS 'AES-256-GCM payload + scrypt; password stored as bcrypt; unlock via public API with rate limit';

DO $$
BEGIN
  RAISE NOTICE '✅ tiwater_secret_links table created';
END $$;
