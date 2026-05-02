-- Repayment schedules cədvəlindəki artıq Hibernate sütunlarının təmizlənməsi
ALTER TABLE repayment_schedules DROP COLUMN IF EXISTS interest_paid;
ALTER TABLE repayment_schedules DROP COLUMN IF EXISTS principal_paid;
ALTER TABLE repayment_schedules DROP COLUMN IF EXISTS penalty_paid;
ALTER TABLE repayment_schedules DROP COLUMN IF EXISTS total_paid;
ALTER TABLE repayment_schedules DROP COLUMN IF EXISTS paid;
ALTER TABLE repayment_schedules DROP COLUMN IF EXISTS period;
