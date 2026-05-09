-- ============================================================================
-- inspect_user_update_failure.sql
--
-- Run this in Supabase SQL Editor. It is READ-ONLY — no data is changed.
-- Paste the four result blocks back to me.
-- ============================================================================

-- 1. What columns does the production `users` table actually have?
--    Compare against the User Sequelize model — any model column missing
--    here will break SELECT/UPDATE in the API.
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;


-- 2. Show the user id=3 (the one the Edit Staff modal is trying to update).
--    Adjust the id if a different staff member is being edited.
SELECT
  id, username, email, full_name, role, status, department, phone, created_at
FROM users
WHERE id = 3;


-- 3. Any duplicate emails or usernames that could trip a unique constraint?
SELECT email,    COUNT(*) AS dup FROM users GROUP BY email    HAVING COUNT(*) > 1;
SELECT username, COUNT(*) AS dup FROM users GROUP BY username HAVING COUNT(*) > 1;


-- 4. List the most recently-created users — helps identify which staff
--    record is being clicked in the directory.
SELECT id, username, email, full_name, role, status, created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;
