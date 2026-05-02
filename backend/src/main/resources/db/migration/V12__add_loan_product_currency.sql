ALTER TABLE loan_products ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'AZN';

UPDATE loan_products SET currency = 'AZN' WHERE currency IS NULL;

ALTER TABLE loan_products ALTER COLUMN currency SET NOT NULL;
