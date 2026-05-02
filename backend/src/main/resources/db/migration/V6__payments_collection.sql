
CREATE TYPE payment_method AS ENUM (
    'CASH', 'BANK_TRANSFER', 'CARD', 'ONLINE', 'DIRECT_DEBIT'
);

CREATE TYPE payment_allocation AS ENUM (
    'REGULAR',      -- Adi aylıq ödəniş
    'PENALTY',      -- Yalnız cərimə ödənişi
    'PARTIAL',      -- Qismən ödəniş
    'EARLY_CLOSE',  -- Erkən bağlanma
    'RESTRUCTURE'   -- Restrukturizasiya ödənişi
);

CREATE TYPE collection_action AS ENUM (
    'CALL', 'SMS', 'EMAIL', 'VISIT', 'LEGAL_NOTICE', 'COURT_FILING'
);

CREATE TYPE task_status AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- -----------------------------------------------
-- PAYMENT TRANSACTIONS (Ödənişlər)
-- -----------------------------------------------
CREATE TABLE payment_transactions (
    id                      BIGSERIAL PRIMARY KEY,
    transaction_no          VARCHAR(30) NOT NULL UNIQUE,   -- TXN-2024-000001
    loan_account_id         BIGINT NOT NULL REFERENCES loan_accounts(id),
    schedule_id             BIGINT REFERENCES repayment_schedules(id),  -- Hansı taksit üçün
    -- Ödəniş məbləği
    amount                  NUMERIC(18,2) NOT NULL,
    currency                currency_code NOT NULL DEFAULT 'AZN',
    amount_azn              NUMERIC(18,2) NOT NULL,
    exchange_rate           NUMERIC(18,6),
    -- Dağıtım (penalty → interest → principal qaydası)
    allocated_penalty       NUMERIC(18,2) NOT NULL DEFAULT 0,
    allocated_interest      NUMERIC(18,2) NOT NULL DEFAULT 0,
    allocated_principal     NUMERIC(18,2) NOT NULL DEFAULT 0,
    -- Ödəniş detalları
    payment_method          payment_method NOT NULL,
    payment_type            payment_allocation NOT NULL DEFAULT 'REGULAR',
    reference_no            VARCHAR(100),     -- Bank referans nömrəsi
    payment_date            DATE NOT NULL,
    received_at             TIMESTAMP NOT NULL DEFAULT NOW(),
    -- Balans
    outstanding_before      NUMERIC(18,2),
    outstanding_after       NUMERIC(18,2),
    -- Audit
    received_by             BIGINT NOT NULL REFERENCES users(id),
    notes                   TEXT,
    is_reversed             BOOLEAN NOT NULL DEFAULT FALSE,
    reversed_at             TIMESTAMP,
    reversed_by             BIGINT REFERENCES users(id),
    reversal_reason         TEXT,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE txn_no_seq START 1 INCREMENT 1;

CREATE INDEX idx_payment_account ON payment_transactions(loan_account_id);
CREATE INDEX idx_payment_date    ON payment_transactions(payment_date DESC);
CREATE INDEX idx_payment_no      ON payment_transactions(transaction_no);

-- -----------------------------------------------
-- COLLECTION TASKS (İnkasso tapşırıqları)
-- -----------------------------------------------
CREATE TABLE collection_tasks (
    id              BIGSERIAL PRIMARY KEY,
    loan_account_id BIGINT NOT NULL REFERENCES loan_accounts(id),
    customer_id     BIGINT NOT NULL REFERENCES customers(id),
    assigned_to     BIGINT NOT NULL REFERENCES users(id),
    -- Gecikmə vəziyyəti
    overdue_days    INTEGER NOT NULL,
    overdue_amount  NUMERIC(18,2) NOT NULL,
    bucket          VARCHAR(10) NOT NULL,  -- '1-30', '31-60', '61-90', '90+'
    -- Tapşırıq
    action_type     collection_action NOT NULL,
    priority        VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',  -- LOW, MEDIUM, HIGH, CRITICAL
    due_date        DATE NOT NULL,
    status          task_status NOT NULL DEFAULT 'OPEN',
    -- Nəticə
    contact_made    BOOLEAN,
    promise_to_pay  BOOLEAN,
    promise_date    DATE,
    promise_amount  NUMERIC(18,2),
    result_note     TEXT,
    completed_at    TIMESTAMP,
    -- Audit
    created_by      BIGINT NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collection_account  ON collection_tasks(loan_account_id);
CREATE INDEX idx_collection_assigned ON collection_tasks(assigned_to);
CREATE INDEX idx_collection_status   ON collection_tasks(status);
CREATE INDEX idx_collection_bucket   ON collection_tasks(bucket);
CREATE INDEX idx_collection_due      ON collection_tasks(due_date);
