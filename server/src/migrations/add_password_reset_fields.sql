-- Migration: Add password reset fields to users table
-- Purpose: Support secure password reset functionality

-- Add password reset token field
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "passwordResetToken" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMP;

-- Add comments for documentation
COMMENT ON COLUMN users."passwordResetToken" IS 'Hashed token for password reset requests';
COMMENT ON COLUMN users."passwordResetExpires" IS 'Expiration time for password reset token (1 hour from request)';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users("passwordResetToken");
CREATE INDEX IF NOT EXISTS idx_users_password_reset_expires ON users("passwordResetExpires");
