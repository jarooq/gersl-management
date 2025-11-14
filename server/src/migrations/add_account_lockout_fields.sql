-- Migration: Add account lockout fields to users table
-- Purpose: Implement account lockout after failed login attempts

-- Add failed login attempts counter
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER DEFAULT 0;

-- Add account locked until timestamp
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "accountLockedUntil" TIMESTAMP;

-- Add comments for documentation
COMMENT ON COLUMN users."failedLoginAttempts" IS 'Number of consecutive failed login attempts';
COMMENT ON COLUMN users."accountLockedUntil" IS 'Account locked until this timestamp after too many failed attempts (15 minutes)';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_account_locked ON users("accountLockedUntil");
