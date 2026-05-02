
CREATE TYPE recommendation_type AS ENUM ('APPROVE', 'REJECT', 'MANUAL_REVIEW', 'REQUEST_DOCS');
CREATE TYPE decision_type AS ENUM ('APPROVED', 'REJECTED', 'ESCALATED', 'NEED_MORE_INFO');
CREATE TYPE bureau_status AS ENUM ('PENDING', 'RECEIVED', 'FAILED', 'SKIPPED');

-- -----------------------------------------------
-- CREDIT BUREAU QUERIES (AKB sorğuları)
-- -----------------------------------------------
CREATE TABLE bureau_queries (
    id              BIGSERIAL PRIMARY KEY,
    application_id  BIGINT NOT NULL REFERENCES loan_applications(id),
    customer_id     BIGINT NOT NULL REFERENCES customers(id),
    fin_code        VARCHAR(7) NOT NULL,
    status          bureau_status NOT NULL DEFAULT 'PENDING',
    -- AKB cavabı
    bureau_score    INTEGER,             -- 300–850
    total_debt_azn  NUMERIC(18,2),
    active_loans    INTEGER,
    overdue_days    INTEGER,
    default_history BOOLEAN,
    raw_response    TEXT,               -- JSON formatında tam cavab
    queried_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    responded_at    TIMESTAMP,
    error_message   TEXT,
    is_simulated    BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_bureau_app ON bureau_queries(application_id);

-- -----------------------------------------------
-- CREDIT ASSESSMENTS (Risk qiymətləndirməsi)
-- -----------------------------------------------
CREATE TABLE credit_assessments (
    id                      BIGSERIAL PRIMARY KEY,
    application_id          BIGINT NOT NULL UNIQUE REFERENCES loan_applications(id),
    -- Gəlir / Xərc analizi
    monthly_income_azn      NUMERIC(18,2) NOT NULL,
    monthly_expense_azn     NUMERIC(18,2) NOT NULL DEFAULT 0,
    existing_loan_payment   NUMERIC(18,2) NOT NULL DEFAULT 0,  -- Mövcud aylıq kredit ödənişi
    proposed_payment        NUMERIC(18,2),                     -- Yeni kreditin aylıq ödənişi
    -- DTI hesablanması
    total_monthly_obligations NUMERIC(18,2),  -- existing + proposed
    dti_ratio               NUMERIC(6,2),     -- % = total_obligations / income * 100
    -- Girov analizi
    collateral_value_azn    NUMERIC(18,2),
    ltv_ratio               NUMERIC(6,2),     -- Loan-to-Value %
    -- Scoring
    bureau_score            INTEGER,          -- AKB-dən
    internal_score          INTEGER,          -- 0–100 daxili hesablama
    -- Daxili scoring komponentləri
    score_dti               INTEGER,          -- DTI komponenti (0-40)
    score_bureau            INTEGER,          -- Kredit tarixi (0-30)
    score_employment        INTEGER,          -- İş stajı (0-20)
    score_age               INTEGER,          -- Yaş (0-10)
    -- Analitik qərarı
    recommendation          recommendation_type NOT NULL,
    auto_decided            BOOLEAN NOT NULL DEFAULT FALSE,
    notes                   TEXT,
    -- Kim etdi
    assessed_by             BIGINT REFERENCES users(id),
    assessed_at             TIMESTAMP,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- APPROVAL DECISIONS (Qərar log-u)
-- -----------------------------------------------
CREATE TABLE approval_decisions (
    id                  BIGSERIAL PRIMARY KEY,
    application_id      BIGINT NOT NULL REFERENCES loan_applications(id),
    approver_id         BIGINT NOT NULL REFERENCES users(id),
    decision            decision_type NOT NULL,
    -- Təsdiq edilmiş parametrlər
    approved_amount     NUMERIC(18,2),
    approved_term       INTEGER,
    approved_rate       NUMERIC(6,4),
    origination_fee     NUMERIC(18,2),
    -- Şərtlər
    conditions          TEXT,             -- Xüsusi şərtlər (JSON və ya plain text)
    rejection_reason    VARCHAR(100),     -- Standartlaşdırılmış rədd səbəbi
    comment             TEXT,
    -- Eskalasiya
    escalated_to        BIGINT REFERENCES users(id),
    escalation_reason   TEXT,
    -- Tarix
    decided_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    level               INTEGER NOT NULL DEFAULT 1,  -- 1=şöbə rəhbəri, 2=komitə, 3=baş ofis
    UNIQUE (application_id, level)
);

CREATE INDEX idx_approval_app      ON approval_decisions(application_id);
CREATE INDEX idx_approval_approver ON approval_decisions(approver_id);
