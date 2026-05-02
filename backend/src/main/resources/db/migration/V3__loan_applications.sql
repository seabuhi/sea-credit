
CREATE TYPE application_status AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'PRECHECK_PASSED',
    'PRECHECK_FAILED',
    'PENDING_BUREAU',
    'DOCUMENTS_PENDING',
    'UNDER_REVIEW',
    'RISK_ASSESSMENT_DONE',
    'APPROVED',
    'REJECTED',
    'CONTRACT_GENERATED',
    'SIGNED',
    'DISBURSED',
    'ACTIVE',
    'OVERDUE',
    'RESTRUCTURED',
    'CLOSED',
    'CANCELLED'
);

CREATE TYPE document_type AS ENUM (
    'ID_CARD',
    'SALARY_CERTIFICATE',
    'BANK_STATEMENT',
    'EMPLOYMENT_CERTIFICATE',
    'COLLATERAL_DEED',
    'COLLATERAL_VALUATION',
    'GUARANTOR_ID',
    'GUARANTOR_INCOME',
    'TAX_RETURN',
    'BUSINESS_REGISTRATION',
    'FINANCIAL_STATEMENT',
    'OTHER'
);

CREATE TYPE document_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- -----------------------------------------------
-- LOAN APPLICATIONS (Kredit Müraciətləri)
-- -----------------------------------------------
CREATE TABLE loan_applications (
    id                  BIGSERIAL PRIMARY KEY,
    application_no      VARCHAR(20)  NOT NULL UNIQUE,   -- APP-2024-000001
    customer_id         BIGINT       NOT NULL REFERENCES customers(id),
    loan_product_id     BIGINT       NOT NULL REFERENCES loan_products(id),
    -- Tələb olunan parametrlər
    requested_amount    NUMERIC(18,2) NOT NULL,
    requested_term      INTEGER       NOT NULL,  -- ay
    currency            currency_code NOT NULL DEFAULT 'AZN',
    -- AZN ekvivalenti (hesablama üçün)
    requested_amount_azn NUMERIC(18,2),
    exchange_rate_used  NUMERIC(18,6),
    purpose             TEXT,
    -- Girov məlumatı
    has_collateral      BOOLEAN NOT NULL DEFAULT FALSE,
    collateral_type     VARCHAR(100),
    collateral_description TEXT,
    collateral_estimated_value NUMERIC(18,2),
    -- Zamin
    has_guarantor       BOOLEAN NOT NULL DEFAULT FALSE,
    guarantor_name      VARCHAR(255),
    guarantor_fin       VARCHAR(7),
    guarantor_phone     VARCHAR(20),
    -- Müraciətin idarə edilməsi
    status              application_status NOT NULL DEFAULT 'DRAFT',
    submitted_at        TIMESTAMP,
    assigned_to         BIGINT REFERENCES users(id),    -- Kredit müfəttişi
    -- Precheck nəticəsi
    precheck_passed     BOOLEAN,
    precheck_notes      TEXT,
    precheck_at         TIMESTAMP,
    -- Audit
    created_by          BIGINT NOT NULL REFERENCES users(id),
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    version             INTEGER NOT NULL DEFAULT 0
);

CREATE SEQUENCE app_no_seq START 1 INCREMENT 1;

CREATE INDEX idx_loan_app_customer   ON loan_applications(customer_id);
CREATE INDEX idx_loan_app_status     ON loan_applications(status);
CREATE INDEX idx_loan_app_assigned   ON loan_applications(assigned_to);
CREATE INDEX idx_loan_app_no         ON loan_applications(application_no);
CREATE INDEX idx_loan_app_created    ON loan_applications(created_at DESC);

-- -----------------------------------------------
-- APPLICATION DOCUMENTS (Sənədlər)
-- -----------------------------------------------
CREATE TABLE application_documents (
    id              BIGSERIAL PRIMARY KEY,
    application_id  BIGINT       NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    document_type   document_type NOT NULL,
    file_name       VARCHAR(500) NOT NULL,
    file_path       VARCHAR(1000) NOT NULL,
    file_size       BIGINT,
    content_type    VARCHAR(100),
    status          document_status NOT NULL DEFAULT 'PENDING',
    rejection_note  TEXT,
    version_no      INTEGER NOT NULL DEFAULT 1,
    is_latest       BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at      DATE,
    uploaded_by     BIGINT NOT NULL REFERENCES users(id),
    reviewed_by     BIGINT REFERENCES users(id),
    reviewed_at     TIMESTAMP,
    uploaded_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_docs_application ON application_documents(application_id);
CREATE INDEX idx_app_docs_type        ON application_documents(document_type);
CREATE INDEX idx_app_docs_latest      ON application_documents(application_id, is_latest);

-- -----------------------------------------------
-- STATUS HISTORY (Hər status dəyişikliyi)
-- -----------------------------------------------
CREATE TABLE status_history (
    id              BIGSERIAL PRIMARY KEY,
    application_id  BIGINT NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    old_status      application_status,
    new_status      application_status NOT NULL,
    notes           TEXT,
    changed_by      BIGINT NOT NULL REFERENCES users(id),
    changed_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_status_history_app ON status_history(application_id);
