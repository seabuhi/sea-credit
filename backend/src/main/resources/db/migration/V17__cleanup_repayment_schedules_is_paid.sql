-- Repayment schedules cədvəlindəki artıq 'is_paid' sütununun silinməsi
ALTER TABLE repayment_schedules DROP COLUMN IF EXISTS is_paid;
