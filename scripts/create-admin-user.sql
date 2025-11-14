-- Create Admin User in Supabase
-- Replace the password hash with your generated hash

INSERT INTO "Users" (
  username,
  email,
  password,
  "fullName",
  role,
  status,
  "createdAt",
  "updatedAt"
) VALUES (
  'admin',
  'admin@gersl.org',
  '$2a$10$YOUR_BCRYPT_HASH_HERE',  -- Replace with actual hash
  'System Administrator',
  'Super Admin',
  'Active',
  NOW(),
  NOW()
);

-- Verify user was created
SELECT id, username, email, role, status, "createdAt"
FROM "Users"
WHERE username = 'admin';
