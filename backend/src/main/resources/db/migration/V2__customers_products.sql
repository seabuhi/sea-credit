
CREATE TYPE employment_status AS ENUM (
    'EMPLOYED', 'SELF_EMPLOYED', 'BUSINESS_OWNER', 'RETIRED', 'UNEMPLOYED', 'STUDENT'
);

CREATE TYPE currency_code AS ENUM ('AZN', 'USD', 'EUR');

CREATE TYPE interest_type AS ENUM ('ANNUITET', 'DIFFERENTIAL');

-- -----------------------------------------------
-- EXCHANGE RATES (Mərkəzi Bank)
-- -----------------------------------------------
CREATE TABLE exchange_rates (
    id          BIGSERIAL PRIMARY KEY,
    currency    currency_code NOT NULL,
    rate_to_azn NUMERIC(18,6) NOT NULL,   -- 1 USD = X AZN
    rate_date   DATE NOT NULL,
    source      VARCHAR(50) NOT NULL DEFAULT 'CBA',
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (currency, rate_date)
);

CREATE INDEX idx_exchange_rates_date ON exchange_rates(rate_date DESC);

-- -----------------------------------------------
-- CUSTOMERS
-- -----------------------------------------------
CREATE TABLE customers (
    id                  BIGSERIAL PRIMARY KEY,
    -- Şəxsi məlumatlar
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    middle_name         VARCHAR(100),
    fin_code            VARCHAR(7)   NOT NULL UNIQUE,   -- Azərbaycan FİN
    id_serial           VARCHAR(20)  NOT NULL,          -- Şəxsiyyət seriya nömrəsi
    id_issued_by        VARCHAR(255),
    id_issued_date      DATE,
    id_expiry_date      DATE,
    birth_date          DATE         NOT NULL,
    gender              CHAR(1)      CHECK (gender IN ('M','F')),
    -- Əlaqə
    mobile              VARCHAR(20)  NOT NULL,
    mobile_alt          VARCHAR(20),
    email               VARCHAR(255),
    address             TEXT,
    city                VARCHAR(100),
    -- İş/Gəlir məlumatları
    employment_status   employment_status NOT NULL,
    employer_name       VARCHAR(255),
    employer_address    VARCHAR(255),
    employer_phone      VARCHAR(20),
    position            VARCHAR(255),
    employment_start    DATE,
    monthly_income      NUMERIC(18,2),
    monthly_expense     NUMERIC(18,2),
    income_currency     currency_code NOT NULL DEFAULT 'AZN',
    -- Risk profili (AKB-dən)
    credit_score        INTEGER,                         -- AKB skoru (300–850)
    risk_category       VARCHAR(20),                     -- A, B, C, D, E
    bureau_checked_at   TIMESTAMP,
    -- Sistem
    is_blacklisted      BOOLEAN NOT NULL DEFAULT FALSE,
    blacklist_reason    TEXT,
    user_id             BIGINT      REFERENCES users(id),
    created_by          BIGINT      NOT NULL REFERENCES users(id),
    created_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_fin       ON customers(fin_code);
CREATE INDEX idx_customers_mobile    ON customers(mobile);
CREATE INDEX idx_customers_name      ON customers(last_name, first_name);
CREATE INDEX idx_customers_blacklist ON customers(is_blacklisted);

-- -----------------------------------------------
-- LOAN PRODUCTS (Kredit Məhsulları)
-- -----------------------------------------------
CREATE TABLE loan_products (
    id                      BIGSERIAL PRIMARY KEY,
    name                    VARCHAR(255) NOT NULL,
    code                    VARCHAR(50)  NOT NULL UNIQUE,
    description             TEXT,
    -- Məbləğ limitləri
    min_amount              NUMERIC(18,2) NOT NULL,
    max_amount              NUMERIC(18,2) NOT NULL,
    -- Müddət (ay)
    min_term_months         INTEGER NOT NULL,
    max_term_months         INTEGER NOT NULL,
    -- Faiz
    interest_type           interest_type NOT NULL DEFAULT 'ANNUITET',
    base_interest_rate      NUMERIC(6,4) NOT NULL,  -- İllik, məsələn 18.00%
    min_interest_rate       NUMERIC(6,4),
    max_interest_rate       NUMERIC(6,4),
    -- Komisyon
    origination_fee_rate    NUMERIC(6,4) NOT NULL DEFAULT 0,  -- Açılış komissiyası %
    early_repayment_fee     NUMERIC(6,4) NOT NULL DEFAULT 0,  -- Erkən ödəmə cəriməsi %
    -- Cərimə kateqoriyaları (gecikmə)
    penalty_rate_1_30       NUMERIC(6,4) NOT NULL DEFAULT 0.1,   -- 1-30 gün
    penalty_rate_31_60      NUMERIC(6,4) NOT NULL DEFAULT 0.2,   -- 31-60 gün
    penalty_rate_61_90      NUMERIC(6,4) NOT NULL DEFAULT 0.3,   -- 61-90 gün
    penalty_rate_90_plus    NUMERIC(6,4) NOT NULL DEFAULT 0.5,   -- 90+ gün (NPL)
    -- Uyğunluq şərtləri
    min_age                 INTEGER NOT NULL DEFAULT 18,
    max_age                 INTEGER NOT NULL DEFAULT 65,
    min_income              NUMERIC(18,2),
    max_dti                 NUMERIC(5,2) NOT NULL DEFAULT 40.00, -- Maks DTI %
    collateral_required     BOOLEAN NOT NULL DEFAULT FALSE,
    guarantor_required      BOOLEAN NOT NULL DEFAULT FALSE,
    -- Valyuta
    allowed_currencies      TEXT NOT NULL DEFAULT 'AZN',  -- 'AZN,USD,EUR' comma-separated
    -- Tələb olunan sənəd tipləri (JSON array)
    required_doc_types      TEXT,
    -- Status
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_by              BIGINT  NOT NULL REFERENCES users(id),
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Approval limits (hansı rol neçə AZN-ə qədər təsdiqləyə bilər)
CREATE TABLE approval_limits (
    id              BIGSERIAL PRIMARY KEY,
    role_name       VARCHAR(50) NOT NULL UNIQUE,
    max_amount_azn  NUMERIC(18,2) NOT NULL,  -- NULL = limitsiz
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO approval_limits (role_name, max_amount_azn) VALUES
    ('CREDIT_OFFICER', 5000.00),
    ('APPROVER',       20000.00),
    ('ADMIN',          999999999.00);

-- Seed loan products
INSERT INTO loan_products (
    name, code, min_amount, max_amount, min_term_months, max_term_months,
    base_interest_rate, origination_fee_rate, max_dti, collateral_required, is_active, created_by
) VALUES
    ('İstehlak Krediti',  'CONSUMER',   500,    30000,  3,  60, 18.00, 1.00, 40, FALSE, TRUE, 1),
    ('Avtomobil Krediti', 'AUTO',        3000,   80000,  12, 84, 14.00, 1.50, 40, TRUE,  TRUE, 1),
    ('İpoteka',           'MORTGAGE',   20000,  500000, 60, 360, 9.00, 0.50, 40, TRUE,  TRUE, 1),
    ('Biznes Krediti',    'BUSINESS',   2000,   200000, 6,  120, 16.00, 2.00, 50, TRUE,  TRUE, 1),
    ('Mikro Kredit',      'MICRO',      100,    3000,   1,  24,  24.00, 2.00, 45, FALSE, TRUE, 1);
