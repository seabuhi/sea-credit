ALTER TABLE loan_products ADD COLUMN IF NOT EXISTS min_age INTEGER DEFAULT 18;
ALTER TABLE loan_products ADD COLUMN IF NOT EXISTS max_age INTEGER DEFAULT 65;
ALTER TABLE loan_products ADD COLUMN IF NOT EXISTS min_income DECIMAL(18, 2) DEFAULT 0.00;

UPDATE loan_products SET min_age = 18 WHERE min_age IS NULL;
UPDATE loan_products SET max_age = 65 WHERE max_age IS NULL;
UPDATE loan_products SET min_income = 0.00 WHERE min_income IS NULL;

ALTER TABLE loan_products ALTER COLUMN min_age SET NOT NULL;
ALTER TABLE loan_products ALTER COLUMN max_age SET NOT NULL;
