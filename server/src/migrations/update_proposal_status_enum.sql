-- Update Proposal Status ENUM to support full workflow
-- Adds: 'Submitted to Donor', 'Donor Approved', 'Donor Rejected'

-- Step 1: Alter the enum type to add new values
ALTER TYPE "enum_proposals_status" ADD VALUE IF NOT EXISTS 'Submitted to Donor';
ALTER TYPE "enum_proposals_status" ADD VALUE IF NOT EXISTS 'Donor Approved';
ALTER TYPE "enum_proposals_status" ADD VALUE IF NOT EXISTS 'Donor Rejected';

-- Verify the new enum values
-- SELECT unnest(enum_range(NULL::enum_proposals_status));
