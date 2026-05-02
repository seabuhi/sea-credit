
CREATE TYPE loan_account_status AS ENUM (
    'ACTIVE', 'OVERDUE', 'NPL', 'RESTRUCTURED', 'CLOSED', 'WRITTEN_OFF'
);

CREATE TYPE schedule_status AS ENUM (
    'PENDING', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'WAIVED'
);

-- -----------------------------------------------
-- LOAN ACCOUNTS (Kredit hesabları)
-- -----------------------------------------------
CREATE TABLE loan_accounts (
    id                      BIGSERIAL PRIMARY KEY,
    application_id          BIGINT NOT NULL UNIQUE REFERENCES loan_applications(id),
    contract_no             VARCHAR(30) NOT NULL UNIQUE,   -- KON-2024-000001
    customer_id             BIGINT NOT NULL REFERENCES customers(id),
    loan_product_id         BIGINT NOT NULL REFERENCES loan_products(id),
    -- Əsas parametrlər
    principal_amount        NUMERIC(18,2) NOT NULL,
    currency                currency_code NOT NULL DEFAULT 'AZN',
    principal_amount_azn    NUMERIC(18,2) NOT NULL,       -- AZN ekvivalenti
    exchange_rate           NUMERIC(18,6),
    interest_rate           NUMERIC(6,4) NOT NULL,        -- İllik %
    interest_type           interest_type NOT NULL DEFAULT 'ANNUITET',
    term_months             INTEGER NOT NULL,
    origination_fee         NUMERIC(18,2) NOT NULL DEFAULT 0,
    -- Tarixlər
    disbursed_at            TIMESTAMP,
    start_date              DATE,
    maturity_date           DATE,
    -- Cari balans
    outstanding_principal   NUMERIC(18,2) NOT NULL,
    accrued_interest        NUMERIC(18,2) NOT NULL DEFAULT 0,
    accrued_penalty         NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_paid_principal    NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_paid_interest     NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_paid_penalty      NUMERIC(18,2) NOT NULL DEFAULT 0,
    -- Gecikmə
    status                  loan_account_status NOT NULL DEFAULT 'ACTIVE',
    overdue_days            INTEGER NOT NULL DEFAULT 0,
    overdue_since           DATE,
    is_npl                  BOOLEAN NOT NULL DEFAULT FALSE,
    npl_since               DATE,
    -- Restrukturizasiya
    is_restructured         BOOLEAN NOT NULL DEFAULT FALSE,
    restructured_at         TIMESTAMP,
    original_account_id     BIGINT REFERENCES loan_accounts(id),
    -- Disbursement
    disbursement_method     VARCHAR(50),   -- CASH, BANK_TRANSFER, CARD
    disbursement_reference  VARCHAR(100),
    disbursed_by            BIGINT REFERENCES users(id),
    -- Bağlanma
    closed_at               TIMESTAMP,
    closed_by               BIGINT REFERENCES users(id),
    close_reason            TEXT,
    -- Audit
    created_by              BIGINT NOT NULL REFERENCES users(id),
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    version                 INTEGER NOT NULL DEFAULT 0
);

CREATE SEQUENCE contract_no_seq START 1 INCREMENT 1;

CREATE INDEX idx_loan_acc_customer  ON loan_accounts(customer_id);
CREATE INDEX idx_loan_acc_status    ON loan_accounts(status);
CREATE INDEX idx_loan_acc_overdue   ON loan_accounts(overdue_days) WHERE overdue_days > 0;
CREATE INDEX idx_loan_acc_npl       ON loan_accounts(is_npl) WHERE is_npl = TRUE;

-- -----------------------------------------------
-- REPAYMENT SCHEDULES (Ödəniş cədvəli)
-- -----------------------------------------------
CREATE TABLE repayment_schedules (
    id                  BIGSERIAL PRIMARY KEY,
    loan_account_id     BIGINT NOT NULL REFERENCES loan_accounts(id) ON DELETE CASCADE,
    installment_no      INTEGER NOT NULL,    -- 1,2,3...
    due_date            DATE NOT NULL,
    -- Hesablanmış
    principal_due       NUMERIC(18,2) NOT NULL,
    interest_due        NUMERIC(18,2) NOT NULL,
    total_due           NUMERIC(18,2) NOT NULL,
    -- Ödənilmiş
    paid_principal      NUMERIC(18,2) NOT NULL DEFAULT 0,
    paid_interest       NUMERIC(18,2) NOT NULL DEFAULT 0,
    paid_penalty        NUMERIC(18,2) NOT NULL DEFAULT 0,
    paid_total          NUMERIC(18,2) NOT NULL DEFAULT 0,
    paid_at             TIMESTAMP,
    -- Cərimə
    penalty_due         NUMERIC(18,2) NOT NULL DEFAULT 0,
    penalty_rate_used   NUMERIC(6,4),
    -- Status
    status              schedule_status NOT NULL DEFAULT 'PENDING',
    overdue_days        INTEGER NOT NULL DEFAULT 0,
    -- Qalıq
    remaining_principal NUMERIC(18,2),   -- Bu ödənişdən sonrakı qalıq borc
    -- Audit
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (loan_account_id, installment_no)
);

CREATE INDEX idx_schedule_account  ON repayment_schedules(loan_account_id);
CREATE INDEX idx_schedule_due_date ON repayment_schedules(due_date);
CREATE INDEX idx_schedule_status   ON repayment_schedules(status);
CREATE INDEX idx_schedule_overdue  ON repayment_schedules(status) WHERE status = 'OVERDUE';
