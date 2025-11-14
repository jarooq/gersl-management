# Vercel + Supabase Complete Setup Guide

Deploy GERSL Management System using **Vercel** (frontend + backend serverless functions) and **Supabase** (PostgreSQL database).

---

## Current Status

✅ **Frontend**: Deployed at https://gersl-management.vercel.app
✅ **Backend API**: Vercel Serverless Functions at https://gersl-management.vercel.app/api
⚠️ **Database**: Needs Supabase configuration in Vercel environment variables

---

## Architecture

```
┌─────────────────────────────────────────┐
│           Vercel Platform               │
│  ┌─────────────┐   ┌─────────────────┐ │       ┌─────────────────┐
│  │  Frontend   │   │  Serverless API │ │       │   Supabase      │
│  │  React/Vite │──▶│  /api/*         │─┼──────▶│  PostgreSQL     │
│  └─────────────┘   └─────────────────┘ │       │  (Managed DB)   │
└─────────────────────────────────────────┘       └─────────────────┘
```

**Benefits:**
- ✅ Single platform deployment (Vercel)
- ✅ Automatic HTTPS/SSL
- ✅ Global CDN
- ✅ No server management
- ✅ Free tier available

---

## Step 1: Get Supabase Connection Details

### 1.1 Access Your Supabase Project

You mentioned you've already connected Supabase! Please provide these details from your Supabase dashboard:

1. Go to https://supabase.com/dashboard → Your Project
2. Navigate to **Settings** → **Database**
3. Find the **Connection pooling** section

### 1.2 Copy These Values

```
Database Host: _________________________________
Database Port: 6543 (pooler) or 5432 (direct)
Database Name: postgres
Database User: postgres.[project-ref]
Database Password: _________________________________
```

Or provide the full connection string:
```
postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

---

## Step 2: Configure Vercel Environment Variables

I'll help you add all the necessary environment variables to Vercel. You'll need to provide your Supabase credentials.

### Required Environment Variables:

```env
# Database (Supabase PostgreSQL)
DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.your-project-ref
DB_PASSWORD=your-supabase-password
DB_DIALECT=postgres

# Server Configuration
NODE_ENV=production
PORT=3001

# JWT Secrets (I'll generate new ones)
JWT_SECRET=<will-generate>
JWT_REFRESH_SECRET=<will-generate>
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://gersl-management.vercel.app
FRONTEND_URL=https://gersl-management.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# AI Features (optional)
GROQ_API_KEY=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
GEMINI_API_KEY=AIzaSyDgi7QYCX5QRRwnlfSjo9c2MiZthRI8eNY

# Database Sync (IMPORTANT: Set to false after first deployment)
ENABLE_DB_SYNC=true
```

---

## Step 3: Add Environment Variables to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. Go to https://vercel.com/gersls-projects/gersl-management/settings/environment-variables
2. Add each variable:
   - **Key**: Variable name (e.g., `DB_HOST`)
   - **Value**: Your value
   - **Environment**: Select all (Production, Preview, Development)
3. Click **Save**

### Option B: Using CLI (I can automate this)

Once you provide your Supabase credentials, I'll create a script to add all variables automatically.

---

## Step 4: Test Database Connection

### 4.1 After Adding Variables

1. Go to https://vercel.com/gersls-projects/gersl-management
2. Go to **Deployments** tab
3. Click **Redeploy** on the latest deployment
4. Wait for deployment (~2 minutes)

### 4.2 Test API Health

```bash
curl https://gersl-management.vercel.app/api/health
```

**Expected response:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-14T...",
  "environment": "production",
  "platform": "Vercel Serverless",
  "database": {
    "host": "aws-0-ap-southeast-1.pooler.supabase.com",
    "dialect": "postgres"
  }
}
```

### 4.3 Check Tables in Supabase

1. Go to Supabase Dashboard → **Table Editor**
2. Verify all 13 tables were created:
   - Users
   - Orphans
   - Projects
   - Expenses
   - Staff
   - CBOPartners
   - Partners
   - Indicators
   - Reports
   - Proposals
   - OrphanVisitLogs
   - OrphanProgressRatings
   - GeneratedOrphanReports

---

## Step 5: Disable Database Sync

**IMPORTANT:** After tables are created, disable auto-sync to prevent accidental schema changes.

1. Go to Vercel → Environment Variables
2. Find `ENABLE_DB_SYNC`
3. Change value to `false`
4. Save and redeploy

---

## Step 6: Create Admin User

### 6.1 Generate Password Hash

Run locally:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourAdminPassword123!', 10).then(console.log)"
```

Copy the hash (starts with `$2a$10$...`)

### 6.2 Insert Admin User in Supabase

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Paste this SQL (replace the hash):

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
  '$2a$10$YOUR_BCRYPT_HASH_HERE',
  'System Administrator',
  'Super Admin',
  'Active',
  NOW(),
  NOW()
);
```

4. Click **Run**
5. Verify: "Success. No rows returned"

### 6.3 Verify Admin User

Run this query:
```sql
SELECT id, username, email, role, status, "createdAt"
FROM "Users"
WHERE username = 'admin';
```

You should see your admin user!

---

## Step 7: Update Frontend API URL

The frontend needs to know where the backend API is located.

### 7.1 Add Environment Variable

Go to Vercel → Environment Variables and add:

```
Key: VITE_API_URL
Value: https://gersl-management.vercel.app/api
Environments: Production, Preview, Development
```

### 7.2 Redeploy

1. Go to **Deployments**
2. Click **Redeploy** on latest deployment
3. Wait for completion

---

## Step 8: Test Full Application

### 8.1 Open Application

Go to: https://gersl-management.vercel.app

### 8.2 Login

- **Username**: `admin`
- **Password**: (whatever you used in Step 6.1)

### 8.3 Test Features

- ✅ Dashboard loads
- ✅ Navigate to Orphans page
- ✅ Create a test orphan
- ✅ Check Projects page
- ✅ Test user management
- ✅ Verify data persists (reload page)

---

## Troubleshooting

### Backend API Returns 500 Error

**Check Vercel Function Logs:**
1. Go to Vercel → Deployments → Latest → Functions
2. Click on `/api/index.js`
3. View error logs

**Common Issues:**
- Missing environment variables
- Wrong Supabase password
- Database connection timeout
- Sequelize models loading too slow (timeout issue)

### "FUNCTION_INVOCATION_TIMEOUT"

This means the serverless function exceeded 10 seconds (free tier limit).

**Solutions:**
1. Upgrade to Vercel Pro ($20/month) for 60-second timeout
2. Or switch to Railway for backend (see SUPABASE_SETUP_COMPLETE.md)

### Tables Not Created in Supabase

**Check:**
1. `ENABLE_DB_SYNC` is set to `true`
2. Database credentials are correct
3. Check Vercel function logs for connection errors

### Login Doesn't Work

**Verify:**
1. Admin user exists in Supabase (run SELECT query)
2. Password hash is correct (bcrypt format)
3. JWT secrets are set in Vercel
4. Check browser console for API errors

---

## Next Steps (Optional)

### Custom Domain

1. Go to Vercel → Settings → Domains
2. Add your domain: `app.gersl.org`
3. Configure DNS records as shown
4. Wait for SSL certificate (~5 minutes)

### Automatic Backups

1. Go to Supabase → Settings → Database → Backups
2. Enable automatic daily backups
3. Set retention period

### Monitoring

**Vercel Analytics:**
- Go to Analytics tab for page views and performance

**Supabase Logs:**
- Go to Logs & Insights for database queries

---

## Cost Summary

- **Vercel Free Tier**:
  - 100GB bandwidth
  - 100 serverless function executions per day
  - Unlimited API requests
  - **Limitation**: 10-second function timeout

- **Vercel Pro** ($20/month):
  - 1TB bandwidth
  - Unlimited function executions
  - 60-second function timeout
  - Better for production

- **Supabase Free Tier**:
  - 500MB database
  - Unlimited API requests
  - 2GB file storage
  - Free forever

**Total Cost:**
- Free tier: $0/month (with limitations)
- Production: $20/month (Vercel Pro)

---

## Important Notes

1. **Serverless Timeout**: If you get timeout errors, you may need to:
   - Optimize your Sequelize models
   - Reduce dependencies
   - Or use Railway for backend instead

2. **Database Sync**: Always set `ENABLE_DB_SYNC=false` after initial deployment to prevent accidental schema changes

3. **Environment Variables**: Changes to environment variables require a redeploy to take effect

4. **Supabase Connection Pooling**: Always use port 6543 (pooler) for better performance with serverless

---

## Need Help?

**Provide me with:**
1. Your Supabase connection string
2. Any error messages from Vercel function logs
3. Screenshots of issues (if any)

I'll help you complete the setup!
