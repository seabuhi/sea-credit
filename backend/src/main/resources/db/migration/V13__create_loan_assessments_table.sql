CREATE TABLE IF NOT EXISTS loan_assessments (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES loan_applications(id),
    internal_rating VARCHAR(10),
    calculated_dti DECIMAL(5,2),
    score INTEGER,
    is_recommended BOOLEAN DEFAULT FALSE,
    assessment_notes TEXT,
    assessed_by BIGINT REFERENCES users(id),
    assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_application_assessment UNIQUE (application_id)
);
