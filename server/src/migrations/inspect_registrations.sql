-- ============================================================================
-- inspect_registrations.sql — diagnose what /staff-register actually saves.
--
-- Run this in Supabase SQL Editor. It is READ-ONLY — no data is changed.
-- Paste the four result blocks back to me.
-- ============================================================================

-- 1. What columns does the `staff` table actually have on prod?
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'staff'
ORDER BY ordinal_position;


-- 2. What columns does the `users` table actually have on prod?
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;


-- 3. The 5 most recent staff rows — every column.
-- Look for which fields are NULL vs populated.
SELECT *
FROM staff
ORDER BY created_at DESC NULLS LAST
LIMIT 5;


-- 4. The 5 most recent user rows — only the human-relevant columns.
-- We don't print password / refresh_token / etc.
SELECT
  id, username, email, full_name, phone, department, role, status, created_at
FROM users
ORDER BY created_at DESC NULLS LAST
LIMIT 5;
