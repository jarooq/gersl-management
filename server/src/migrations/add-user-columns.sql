-- Add missing columns to users table
-- Migration for hierarchyLevel, specialization, reportingTo

-- Add hierarchyLevel column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='hierarchy_level') THEN
        ALTER TABLE users ADD COLUMN hierarchy_level INTEGER;
        COMMENT ON COLUMN users.hierarchy_level IS 'Organizational hierarchy level (1=highest, 7=lowest)';
    END IF;
END $$;

-- Add specialization column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='specialization') THEN
        ALTER TABLE users ADD COLUMN specialization VARCHAR(50);
        COMMENT ON COLUMN users.specialization IS 'Role specialization (e.g., WASH, Orphans, etc.)';
    END IF;
END $$;

-- Add reportingTo column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='reporting_to') THEN
        ALTER TABLE users ADD COLUMN reporting_to INTEGER REFERENCES users(id);
        COMMENT ON COLUMN users.reporting_to IS 'User ID of the supervisor this user reports to';
    END IF;
END $$;

-- Add passwordResetToken column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='password_reset_token') THEN
        ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255);
        COMMENT ON COLUMN users.password_reset_token IS 'Token for password reset requests';
    END IF;
END $$;

-- Add passwordResetExpires column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='password_reset_expires') THEN
        ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMP;
        COMMENT ON COLUMN users.password_reset_expires IS 'Expiration time for password reset token (1 hour)';
    END IF;
END $$;

-- Add failedLoginAttempts column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='failed_login_attempts') THEN
        ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
        COMMENT ON COLUMN users.failed_login_attempts IS 'Number of consecutive failed login attempts';
    END IF;
END $$;

-- Add accountLockedUntil column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='account_locked_until') THEN
        ALTER TABLE users ADD COLUMN account_locked_until TIMESTAMP;
        COMMENT ON COLUMN users.account_locked_until IS 'Account locked until this timestamp after too many failed attempts';
    END IF;
END $$;

-- Verify columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN (
    'hierarchy_level',
    'specialization',
    'reporting_to',
    'password_reset_token',
    'password_reset_expires',
    'failed_login_attempts',
    'account_locked_until'
)
ORDER BY column_name;
