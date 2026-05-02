
CREATE TABLE audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    entity_name     VARCHAR(100) NOT NULL,   -- 'LoanApplication', 'Customer', ...
    entity_id       BIGINT       NOT NULL,
    action          VARCHAR(50)  NOT NULL,   -- CREATE, UPDATE, DELETE, STATUS_CHANGE
    field_name      VARCHAR(100),
    old_value       TEXT,
    new_value       TEXT,
    description     TEXT,
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(500),
    changed_by      BIGINT NOT NULL REFERENCES users(id),
    changed_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity   ON audit_logs(entity_name, entity_id);
CREATE INDEX idx_audit_user     ON audit_logs(changed_by);
CREATE INDEX idx_audit_date     ON audit_logs(changed_at DESC);

-- -----------------------------------------------
-- NOTIFICATIONS (Bildirişlər)
-- -----------------------------------------------
CREATE TYPE notification_channel AS ENUM ('SMS', 'EMAIL', 'PUSH', 'IN_APP');
CREATE TYPE notification_status  AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');
CREATE TYPE notification_type AS ENUM (
    'APPLICATION_SUBMITTED',
    'APPLICATION_APPROVED',
    'APPLICATION_REJECTED',
    'PAYMENT_DUE_REMINDER',    -- 3 gün qabaq
    'PAYMENT_RECEIVED',
    'PAYMENT_OVERDUE',
    'DISBURSEMENT_COMPLETED',
    'DOCUMENT_REQUEST',
    'COLLECTION_NOTICE',
    'CONTRACT_READY'
);

CREATE TABLE notifications (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id),
    customer_id     BIGINT REFERENCES customers(id),
    type            notification_type NOT NULL,
    channel         notification_channel NOT NULL,
    status          notification_status NOT NULL DEFAULT 'PENDING',
    subject         VARCHAR(255),
    body            TEXT NOT NULL,
    recipient       VARCHAR(255) NOT NULL,   -- email/phone
    -- Əlaqəli entity
    entity_name     VARCHAR(100),
    entity_id       BIGINT,
    -- Göndərmə
    sent_at         TIMESTAMP,
    read_at         TIMESTAMP,
    retry_count     INTEGER NOT NULL DEFAULT 0,
    error_message   TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user     ON notifications(user_id);
CREATE INDEX idx_notif_customer ON notifications(customer_id);
CREATE INDEX idx_notif_status   ON notifications(status);
CREATE INDEX idx_notif_created  ON notifications(created_at DESC);

-- -----------------------------------------------
-- SCHEDULED JOBS LOG (Scheduler nəticələri)
-- -----------------------------------------------
CREATE TABLE scheduler_logs (
    id              BIGSERIAL PRIMARY KEY,
    job_name        VARCHAR(100) NOT NULL,
    started_at      TIMESTAMP NOT NULL,
    finished_at     TIMESTAMP,
    status          VARCHAR(20) NOT NULL,   -- SUCCESS, FAILED, RUNNING
    records_processed INTEGER,
    error_message   TEXT
);
