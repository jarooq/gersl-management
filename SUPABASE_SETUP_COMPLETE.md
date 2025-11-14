# Complete Supabase + Vercel + Railway Deployment Guide

## Quick Overview

**Architecture:**
- **Frontend**: Vercel (React/Vite) - https://vercel.com/gersls-projects
- **Backend**: Railway (Express/Node.js) - Traditional server
- **Database**: Supabase PostgreSQL - Managed database

**Why this architecture?**
- ✅ Keeps existing Express code (no rewrite needed)
- ✅ No serverless timeout issues
- ✅ Professional managed PostgreSQL (Supabase)
- ✅ All free tiers available
- ✅ Easy to scale later

---

## Step 1: Create Supabase Project (5 minutes)

### 1.1 Create Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name**: `gersl-management`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: `Southeast Asia (Singapore)` or closest to your users
4. Click **"Create new project"**
5. Wait ~2 minutes for provisioning

### 1.2 Get Connection Details

Once ready:

1. Go to **Project Settings** (gear icon) → **Database**
2. Scroll to **Connection string** section
3. Copy the **Connection pooling** string (for production use):

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Also copy these individual values:**
- **Host**: `aws-0-[region].pooler.supabase.com`
- **Port**: `6543` (pooler) or `5432` (direct)
- **Database**: `postgres`
- **User**: `postgres.[project-ref]`
- **Password**: Your password

---

## Step 2: Test Local Connection (2 minutes)

### 2.1 Update Local Environment

Update `server/.env`:

```env
# Supabase PostgreSQL Connection
DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.your-project-ref
DB_PASSWORD=your-supabase-password
DB_DIALECT=postgres

# Enable sync to create tables
ENABLE_DB_SYNC=true

# Keep other existing variables
NODE_ENV=development
PORT=3001
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
```

### 2.2 Test Connection

```bash
cd server
npm run dev
```

**Expected output:**
```
Database connected successfully
Server running on port 3001
```

The first run will automatically create all tables in Supabase!

### 2.3 Verify Tables in Supabase

1. Go to Supabase Dashboard → **Table Editor**
2. You should see all tables:
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

## Step 3: Deploy Backend to Railway (10 minutes)

### 3.1 Create Railway Account

1. Go to https://railway.app
2. Sign in with GitHub

### 3.2 Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose: `your-username/gersl-management`

### 3.3 Configure Service

1. **Root Directory**: Click **"Configure"** → Set to: `server`
2. **Start Command**: `npm start`
3. **Build Command**: `npm install`

### 3.4 Add Environment Variables

Click **"Variables"** and add all these:

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
DB_HOST=aws-0-[region].pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.[project-ref]
DB_PASSWORD=your-supabase-password
DB_DIALECT=postgres

# Server
NODE_ENV=production
PORT=3001

# JWT (Generate new production secrets!)
JWT_SECRET=production-secret-here
JWT_REFRESH_SECRET=production-refresh-secret-here
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# CORS (Will update after Vercel deployment)
CORS_ORIGIN=*
FRONTEND_URL=*

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Optional - AI Features
OPENAI_API_KEY=your-key-if-needed
ANTHROPIC_API_KEY=your-key-if-needed

# Optional - Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@gersl.org

# Security
ENABLE_DB_SYNC=false
```

### 3.5 Generate Production JWT Secrets

Run locally:
```bash
openssl rand -base64 64
```

Copy the output for `JWT_SECRET` and run again for `JWT_REFRESH_SECRET`.

### 3.6 Deploy

1. Click **"Deploy"**
2. Wait for deployment (~3 minutes)
3. **Copy your Railway URL**: `https://your-app.up.railway.app`

### 3.7 Test Backend

```bash
curl https://your-app.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-01-14T...",
  "database": {
    "host": "aws-0-ap-southeast-1.pooler.supabase.com",
    "dialect": "postgres"
  }
}
```

---

## Step 4: Deploy Frontend to Vercel (5 minutes)

### 4.1 Login to New Vercel Account

You should already be logged in. If not:

```bash
npx vercel login
```

Use account: https://vercel.com/gersls-projects

### 4.2 Deploy Frontend

```bash
npx vercel --prod
```

When prompted:
- **Set up and deploy?** → `Y`
- **Which scope?** → Select `gersls-projects`
- **Link to existing project?** → `N`
- **Project name?** → `gersl-management`
- **Directory?** → `.` (root)
- **Override settings?** → `N`

### 4.3 Add Environment Variable

After deployment completes:

```bash
npx vercel env add VITE_API_URL production
```

When prompted, enter your Railway URL:
```
https://your-app.up.railway.app/api
```

### 4.4 Redeploy with Environment Variable

```bash
npx vercel --prod
```

### 4.5 Get Your Frontend URL

The deployment will output:
```
Production: https://gersl-management-xxx.vercel.app
```

**Copy this URL!**

---

## Step 5: Update CORS Settings (2 minutes)

### 5.1 Update Railway Environment Variables

Go to Railway Dashboard → Your Project → Variables

Update these:
```env
CORS_ORIGIN=https://gersl-management-xxx.vercel.app
FRONTEND_URL=https://gersl-management-xxx.vercel.app
```

Railway will automatically redeploy.

---

## Step 6: Create Admin User (3 minutes)

### 6.1 Generate Password Hash

Run locally:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourAdminPassword123!', 10).then(console.log)"
```

Copy the hash (starts with `$2a$10$...`)

### 6.2 Insert Admin User

Go to Supabase Dashboard → **SQL Editor** → **New Query**

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
  '$2a$10$your-bcrypt-hash-here',
  'System Administrator',
  'Super Admin',
  'Active',
  NOW(),
  NOW()
);
```

Click **Run**.

---

## Step 7: Test Full Application (5 minutes)

### 7.1 Open Application

Go to: `https://gersl-management-xxx.vercel.app`

### 7.2 Login

- **Username**: `admin`
- **Password**: `YourAdminPassword123!` (whatever you used)

### 7.3 Test Features

1. ✅ Login works
2. ✅ Dashboard loads
3. ✅ Navigate to Orphans page
4. ✅ Try creating a test orphan
5. ✅ Check Projects page
6. ✅ Test user management

---

## Deployment Summary

### 🎉 You're Live!

- **Frontend**: https://gersl-management-xxx.vercel.app
- **Backend**: https://your-app.up.railway.app
- **Database**: Supabase PostgreSQL

### Cost Breakdown (Free Tier)

- ✅ **Vercel**: Free (100GB bandwidth, unlimited requests)
- ✅ **Supabase**: Free (500MB database, unlimited API requests)
- ✅ **Railway**: $5/month credit (should cover small usage)
- **Total**: ~$0-5/month

### What You Get

1. ✅ Production-ready deployment
2. ✅ Managed PostgreSQL database
3. ✅ Automatic HTTPS/SSL
4. ✅ Global CDN (Vercel)
5. ✅ Automatic deployments on git push
6. ✅ Professional domain support
7. ✅ Monitoring and logs

---

## Next Steps (Optional)

### Custom Domain

**Vercel:**
1. Go to Project Settings → Domains
2. Add your domain: `app.gersl.org`
3. Follow DNS configuration

**Railway:**
1. Go to Settings → Domains
2. Add: `api.gersl.org`

### Monitoring

**Supabase:**
- Dashboard → Database → Reports (query performance)

**Railway:**
- Observability tab (CPU, memory, logs)

**Vercel:**
- Analytics tab (page views, performance)

### Automatic Backups

**Supabase:**
- Settings → Database → Backups
- Enable automatic daily backups

### CI/CD

Both Vercel and Railway automatically deploy when you push to GitHub!

---

## Troubleshooting

### Backend won't start
- Check Railway logs
- Verify DATABASE_URL is correct
- Ensure all environment variables are set

### Frontend can't connect to backend
- Check CORS_ORIGIN in Railway
- Verify VITE_API_URL in Vercel
- Check Railway service is running

### Database connection failed
- Verify Supabase password
- Check connection pooler (port 6543)
- Ensure project is not paused (free tier)

### Login doesn't work
- Verify admin user was created in Supabase
- Check JWT secrets are set in Railway
- Verify bcrypt hash is correct

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs

---

**Deployment prepared by Claude Code**
*Generated: January 2025*
