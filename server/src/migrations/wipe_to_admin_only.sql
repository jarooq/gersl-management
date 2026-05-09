-- ============================================================================
-- wipe_to_admin_only.sql
--
-- ⚠️  DESTRUCTIVE — empties the database back to a "fresh install" state.
--
-- KEEPS:
--   • One admin user (set ADMIN_EMAIL below)
--   • roles / permissions / role_permissions (so the admin can still do things)
--   • departments / positions (dropdown seed data used by the register form)
--
-- TRUNCATES (back to empty + identity reset):
--   Every other table in the public schema — staff, attendance, leave,
--   expenses, advances, payslips, movements, fuel claims, visits, orphans,
--   sponsors, projects, proposals, contracts, vendors, RFQs, POs, donations,
--   campaigns, journal entries, cash, audit logs, notifications, etc.
--
-- HOW TO RUN (Supabase SQL editor):
--   1. Edit the ADMIN_EMAIL value on line ~30 below to YOUR admin email.
--   2. (Optional dry run) wrap the DO block in `BEGIN; ... ROLLBACK;` to
--      confirm the script parses + the assertion passes WITHOUT writing.
--   3. Paste into the Supabase SQL editor → Run.
--   4. The output should say `WIPE COMPLETE` and the kept admin id.
--
-- After running:
--   • Log in with that admin's existing credentials.
--   • Hand /staff-register to your team to onboard themselves.
--   • Activate each new user from HR Overview (status Pending → Active +
--     pick a real role).
--
-- Idempotent and transactional — failure rolls back automatically.
-- ============================================================================

DO $$
DECLARE
  -- 👇 EDIT THIS to the email of the admin you want to keep
  admin_email      TEXT := 'globalehsansl@gmail.com';

  -- Tables we never wipe. Kept lowercase to match Postgres folding.
  keep_tables      TEXT[] := ARRAY[
    'users',
    'roles',
    'permissions',
    'role_permissions',
    'departments',
    'positions'
  ];

  admin_id         INT;
  r                RECORD;
  truncate_list    TEXT := '';
BEGIN
  -- Verify the admin exists before we wipe anything
  SELECT id INTO admin_id FROM users WHERE LOWER(email) = LOWER(admin_email) LIMIT 1;
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'No user found with email "%". Edit admin_email at the top of the script and try again.', admin_email;
  END IF;
  RAISE NOTICE 'Will keep admin id=% (email=%)', admin_id, admin_email;

  -- Build a single TRUNCATE statement covering every wipeable table.
  -- One statement with CASCADE handles all FK dependencies in one go and
  -- RESTART IDENTITY resets sequences so new rows start at id=1.
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> ALL(keep_tables)
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE '_prisma_%'
      AND tablename <> 'SequelizeMeta'
  LOOP
    truncate_list := truncate_list || quote_ident(r.tablename) || ', ';
  END LOOP;

  IF length(truncate_list) > 0 THEN
    truncate_list := rtrim(truncate_list, ', ');
    EXECUTE 'TRUNCATE TABLE ' || truncate_list || ' RESTART IDENTITY CASCADE';
    RAISE NOTICE 'Truncated tables: %', truncate_list;
  ELSE
    RAISE NOTICE 'No tables found to truncate.';
  END IF;

  -- Now delete every user except the chosen admin.
  -- (Their token columns stay; we don't bother resetting refreshToken etc.)
  DELETE FROM users WHERE id <> admin_id;
  RAISE NOTICE 'Deleted all users except id=%', admin_id;

  RAISE NOTICE 'WIPE COMPLETE — kept admin id=% (%). Schema and seed data intact.', admin_id, admin_email;
END $$;
