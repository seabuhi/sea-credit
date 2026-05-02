-- V14: Fix enums, missing columns, and sequences

-- 1. Add PENDING_DISBURSEMENT to loan_account_status enum
ALTER TYPE loan_account_status ADD VALUE IF NOT EXISTS 'PENDING_DISBURSEMENT' BEFORE 'ACTIVE';

-- 2. Add ONLINE to payment_method enum
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'ONLINE' AFTER 'TERMINAL';

-- 3. Add closed_at column to loan_accounts
ALTER TABLE loan_accounts ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;

-- 4. Create acc_no_seq sequence (referenced by LoanAccountRepository)
CREATE SEQUENCE IF NOT EXISTS acc_no_seq START 1 INCREMENT 1;
