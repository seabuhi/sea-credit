-- Hibernate tərəfindən ddl-auto=update vasitəsilə yaradılmış artıq sütunların silinməsi

-- loan_accounts təmizlənməsi
ALTER TABLE loan_accounts DROP COLUMN IF EXISTS balance_interest;
ALTER TABLE loan_accounts DROP COLUMN IF EXISTS balance_penalty;
ALTER TABLE loan_accounts DROP COLUMN IF EXISTS balance_principal;
ALTER TABLE loan_accounts DROP COLUMN IF EXISTS disbursement_date;
ALTER TABLE loan_accounts DROP COLUMN IF EXISTS next_payment_date;

-- repayment_schedules təmizlənməsi
ALTER TABLE repayment_schedules DROP COLUMN IF EXISTS interest_paid;
ALTER TABLE repayment_schedules DROP COLUMN IF EXISTS principal_paid;
ALTER TABLE repayment_schedules DROP COLUMN IF EXISTS penalty_paid;
ALTER TABLE repayment_schedules DROP COLUMN IF EXISTS total_paid;
ALTER TABLE repayment_schedules DROP COLUMN IF EXISTS paid;
ALTER TABLE repayment_schedules DROP COLUMN IF EXISTS period;
