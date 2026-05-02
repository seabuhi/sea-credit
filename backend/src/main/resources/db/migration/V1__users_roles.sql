

CREATE TABLE roles (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,  -- ADMIN, OPERATOR, CREDIT_OFFICER, etc.
    description VARCHAR(255),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id               BIGSERIAL PRIMARY KEY,
    username         VARCHAR(100) NOT NULL UNIQUE,
    email            VARCHAR(255) NOT NULL UNIQUE,
    password_hash    VARCHAR(255) NOT NULL,
    full_name        VARCHAR(255) NOT NULL,
    phone            VARCHAR(20),
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at    TIMESTAMP,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by       BIGINT REFERENCES users(id)
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(512) NOT NULL UNIQUE,
    expires_at  TIMESTAMP NOT NULL,
    is_revoked  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed roles
INSERT INTO roles (name, description) VALUES
    ('ADMIN',            'Tam giriş — sistem idarəçisi'),
    ('OPERATOR',         'Müştəri yarat, müraciət aç, sənəd yüklə'),
    ('CREDIT_OFFICER',   'Kredit analizi, pre-screening'),
    ('RISK_ANALYST',     'Risk qiymətləndirmə, scoring'),
    ('APPROVER',         'Kredit təsdiq/rədd etmə (limit əsasında)'),
    ('CASHIER',          'Disbursement, ödəniş qəbulu'),
    ('COLLECTION_AGENT', 'Gecikmiş kreditlər, collection tapşırıqları'),
    ('CLIENT',           'Müştəri portal girişi — müraciət, izləmə');

-- Default admin user (password: Admin@1234 — bcrypt)
INSERT INTO users (username, email, password_hash, full_name, is_active)
VALUES ('admin', 'admin@seacredit.az',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9VmCeIn8Dy',
        'Sistem Administratoru', TRUE);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'ADMIN';

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_refresh_token ON refresh_tokens(token);
