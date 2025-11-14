# Create Admin User in Supabase

Since your Vercel + Supabase is already connected, you just need to create the admin user!

---

## Step 1: Generate Password Hash

Run this command locally:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Admin123!', 10).then(console.log)"
```

**Or use a custom password:**

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YOUR_PASSWORD_HERE', 10).then(console.log)"
```

**Example output:**
```
$2a$10$xyzABC123...
```

Copy this hash!

---

## Step 2: Create Admin User in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard

2. Select your project (gersl-management)

3. Click on **SQL Editor** (left sidebar)

4. Click **New Query**

5. Paste this SQL (replace `YOUR_HASH_HERE` with the hash from Step 1):

```sql
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
  'YOUR_HASH_HERE',
  'System Administrator',
  'Super Admin',
  'Active',
  NOW(),
  NOW()
);
```

6. Click **Run** (or press Cmd/Ctrl + Enter)

7. You should see: **"Success. No rows returned"**

---

## Step 3: Verify Admin User

Run this query in Supabase SQL Editor:

```sql
SELECT id, username, email, "fullName", role, status, "createdAt"
FROM "Users"
WHERE username = 'admin';
```

You should see your admin user with:
- username: admin
- email: admin@gersl.org
- role: Super Admin
- status: Active

---

## Step 4: Test Login

1. Go to: https://gersl-management.vercel.app

2. Login with:
   - **Username**: `admin`
   - **Password**: `Admin123!` (or your custom password)

3. You should see the dashboard!

---

## Troubleshooting

### "Users table does not exist"

This means the database tables haven't been created yet.

**Solution:**
1. Check if `ENABLE_DB_SYNC` is set to `true` in Vercel environment variables
2. Redeploy your Vercel project
3. Wait for deployment to complete (~2 min)
4. Go to Supabase → Table Editor and check if tables appear

### Login fails with "Invalid credentials"

**Check:**
1. Verify the admin user exists (run SELECT query above)
2. Make sure you're using the correct password (the one you hashed)
3. Check browser console for API errors
4. Verify JWT_SECRET is set in Vercel

### Can't connect to database

**Check:**
1. Verify Supabase integration is active in Vercel
2. Check Vercel function logs for errors
3. Ensure DATABASE_URL environment variable is set

---

## Quick Commands

**Generate password hash:**
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Admin123!', 10).then(console.log)"
```

**Test API:**
```bash
curl https://gersl-management.vercel.app/api/health
```

**Check Vercel logs:**
Go to: https://vercel.com/gersls-projects/gersl-management/logs

---

## Default Admin Credentials

After creation, you can login with:

```
Username: admin
Password: Admin123!  (or your custom password)
```

**⚠️ IMPORTANT**: Change this password after first login!

---

Need help? Check the logs or let me know what error you're seeing!
