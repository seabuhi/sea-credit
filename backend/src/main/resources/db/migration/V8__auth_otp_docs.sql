
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS user_otps (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code            VARCHAR(10) NOT NULL,
    purpose         VARCHAR(50) NOT NULL,   -- 'SIGNUP_VERIFICATION', 'PASSWORD_RESET', 'LOGIN_2FA'
    expires_at      TIMESTAMP NOT NULL,
    is_used         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indices are harder to do 'IF NOT EXISTS' in some PG versions without a block, 
-- but in 9.5+ it works for CREATE INDEX IF NOT EXISTS.
CREATE INDEX IF NOT EXISTS idx_otp_user ON user_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_code ON user_otps(code);

-- -----------------------------------------------
-- APPLICATION DOCUMENTS (Müraciətə aid sənədlər)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS application_documents (
    id              BIGSERIAL PRIMARY KEY,
    application_id  BIGINT NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    document_type   VARCHAR(100) NOT NULL,  -- 'ID_CARD', 'INCOME_STATEMENT', 'COLLATERAL_DOC'
    file_name       VARCHAR(255) NOT NULL,
    file_path       VARCHAR(512) NOT NULL,
    file_size       BIGINT,
    content_type    VARCHAR(100),
    uploaded_by     BIGINT NOT NULL REFERENCES users(id),
    uploaded_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    notes           TEXT
);

CREATE INDEX IF NOT EXISTS idx_doc_application ON application_documents(application_id);

-- -----------------------------------------------
-- Update users table for OTP flow
-- -----------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_verified') THEN
        ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- For existing admin, set verified to true
UPDATE users SET is_verified = TRUE WHERE username = 'admin';
