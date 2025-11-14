# GERSL Management System - Fresh Deployment Guide

**Architecture**: Frontend (Vercel) + Backend (Railway) + Database (Supabase)

**Total Cost**: ~$5/month (Railway only)

**Deployment Time**: ~30 minutes

---

## Overview

```
┌──────────────────┐
│  Vercel (FREE)   │  ← Frontend (React/Vite)
│  Frontend Only   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Railway ($5/mo) │  ← Backend (Node.js/Express)
│  Backend API     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Supabase (FREE)  │  ← Database (PostgreSQL)
│   PostgreSQL     │
└──────────────────┘
```

---

## Prerequisites

- GitHub account
- Vercel account (free tier is fine)
- Railway account (with credit card for $5/month plan)
- Supabase account (free tier)

---

## Step 1: Create New Supabase Project (5 minutes)

### 1.1 Create Project

1. Go to: https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name**: `gersl-production`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to you
4. Click **"Create new project"**
5. Wait ~2 minutes for database to provision

### 1.2 Get Database Credentials

1. Go to **Settings** → **Database**
2. Copy these credentials (you'll need them):
   - **Host**: `aws-X-XX-XXXX-X.pooler.supabase.com`
   - **Port**: `6543` (Pooler for serverless)
   - **Database**: `postgres`
   - **User**: `postgres.[project-ref]`
   - **Password**: [your generated password]

### 1.3 Create Tables

1. Go to **SQL Editor**
2. Click **"New Query"**
3. Open the file `CREATE_ALL_TABLES.sql` from your project root
4. Copy and paste the entire SQL script
5. Click **"Run"**
6. You should see: ✅ Success - 13 tables created

### 1.4 Create Admin User

Run this SQL (replace password hash):

```sql
-- First, generate password hash locally:
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Admin123!', 10).then(console.log)"

INSERT INTO users (
  username, email, password, full_name, role, status, created_at, updated_at
) VALUES (
  'admin',
  'admin@gersl.org',
  '$2a$10$YOUR_HASH_HERE',  -- Replace with generated hash
  'System Administrator',
  'Super Admin',
  'Active',
  NOW(),
  NOW()
);
```

---

## Step 2: Deploy Backend to Railway (10 minutes)

### 2.1 Sign Up for Railway

1. Go to: https://railway.app
2. Click **"Login with GitHub"**
3. Authorize Railway
4. Add payment method (required for deployment)

### 2.2 Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose: `jarooq/gersl-management`
4. Railway will start building

### 2.3 Configure Root Directory

1. Click on your deployed service
2. Go to **Settings** tab
3. Under **Service Settings**:
   - **Root Directory**: `server`
   - **Start Command**: `npm start`
   - Click **"Save"**

### 2.4 Add Environment Variables

Click **"Variables"** tab and add these:

```env
# Server
NODE_ENV=production
PORT=3001

# Database (from Supabase Step 1.2)
DB_HOST=aws-X-XX-XXXX-X.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.YOUR_PROJECT_REF
DB_PASSWORD=YOUR_SUPABASE_PASSWORD
DB_DIALECT=postgres
ENABLE_DB_SYNC=false

# JWT Secrets (generate new ones)
JWT_SECRET=GENERATE_NEW_SECRET_HERE
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=GENERATE_NEW_REFRESH_SECRET_HERE
JWT_REFRESH_EXPIRE=7d

# CORS (update after frontend deployment)
CORS_ORIGIN=https://your-frontend-url.vercel.app
FRONTEND_URL=https://your-frontend-url.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=10000

# AI Features (optional - use existing or generate new)
GROQ_API_KEY=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
GEMINI_API_KEY=AIzaSyDgi7QYCX5QRRwnlfSjo9c2MiZthRI8eNY
```

**Generate JWT Secrets:**
```bash
# Run locally to generate secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('base64'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('base64'))"
```

### 2.5 Get Railway Backend URL

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://gersl-backend-production.up.railway.app`)
4. **Save this URL** - you'll need it for frontend

### 2.6 Test Backend

```bash
curl https://your-railway-url.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "...",
  "database": {
    "host": "supabase...",
    "dialect": "postgres"
  }
}
```

---

## Step 3: Deploy Frontend to Vercel (10 minutes)

### 3.1 Prepare Environment Variables

Create [.env.production](.env.production:1) in the root:

```env
VITE_API_URL=https://your-railway-url.up.railway.app/api
```

### 3.2 Deploy to Vercel

#### Option A: Using Vercel Dashboard

1. Go to: https://vercel.com
2. Click **"Add New..."** → **"Project"**
3. Import `jarooq/gersl-management`
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `.` (leave as root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-railway-url.up.railway.app/api`
6. Click **"Deploy"**

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# When prompted:
# - Set up and deploy? Yes
# - Scope: Select your account
# - Link to existing project? No
# - Project name: gersl-management
# - Directory: ./ (root)
# - Override settings? No
```

### 3.3 Get Frontend URL

After deployment completes:
- Copy your Vercel URL (e.g., `https://gersl-management.vercel.app`)

### 3.4 Update Railway CORS

Go back to Railway:
1. Click **"Variables"** tab
2. Update these variables:
   - `CORS_ORIGIN=https://your-vercel-url.vercel.app`
   - `FRONTEND_URL=https://your-vercel-url.vercel.app`
3. Railway will auto-redeploy

---

## Step 4: Test Full Application (5 minutes)

1. Go to your Vercel URL: `https://your-vercel-url.vercel.app`
2. You should see the login page
3. Login with:
   - **Username**: `admin`
   - **Password**: `Admin123!`
4. Test features:
   - ✅ Dashboard loads
   - ✅ Navigate to different pages
   - ✅ Create a test orphan/project
   - ✅ Data saves to Supabase

---

## Step 5: Commit Clean Version to Git

```bash
# Add all changes
git add .

# Commit
git commit -m "Clean deployment setup: Vercel frontend + Railway backend + Supabase database

- Removed Vercel serverless backend (timeout issues)
- Separated backend to Railway for reliability
- All 13 database tables created in Supabase
- Admin user configured
- Fresh deployment documentation

Architecture:
- Frontend: Vercel (free)
- Backend: Railway (~$5/month)
- Database: Supabase (free)
Total: ~$5/month

🤖 Generated with Claude Code"

# Push to GitHub
git push origin main
```

---

## Troubleshooting

### Backend Health Check Fails

**Check Railway Logs:**
1. Go to Railway → Your Service → **Deployments**
2. Click latest deployment
3. View logs for errors

**Common Issues:**
- Wrong Supabase credentials
- Missing environment variables
- Port configuration

### Frontend Can't Connect to Backend

**Check:**
1. `VITE_API_URL` is set correctly in Vercel
2. CORS settings in Railway match frontend URL
3. Railway service is running (green status)
4. Backend health endpoint works: `curl https://your-railway-url/api/health`

### Can't Login

**Verify:**
1. Admin user exists in Supabase Users table
2. Password hash is correct
3. Backend logs show authentication attempts
4. JWT secrets are set in Railway

**Reset Admin Password:**
```sql
-- Generate new hash:
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('NewPassword123!', 10).then(console.log)"

UPDATE users
SET password = '$2a$10$NEW_HASH_HERE'
WHERE username = 'admin';
```

---

## Cost Breakdown

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Free | $0/month |
| Railway | Starter | ~$5/month |
| Supabase | Free | $0/month |
| **Total** | | **~$5/month** |

---

## Architecture Benefits

✅ **No Timeout Issues**: Railway runs traditional Node.js server

✅ **Better Performance**: No cold starts on backend

✅ **Easier Debugging**: Full server logs in Railway

✅ **Scalable**: Each component can scale independently

✅ **Cost Effective**: Only $5/month total

✅ **Professional Setup**: Industry-standard architecture

---

## Next Steps

After deployment:

1. **Custom Domain** (Optional):
   - Add custom domain in Vercel
   - Update CORS settings in Railway

2. **Monitoring**:
   - Enable Railway metrics
   - Set up Supabase alerts

3. **Backups**:
   - Configure Supabase automatic backups
   - Export data regularly

4. **Team Access**:
   - Add team members in Vercel/Railway
   - Create additional users in the app

---

## Support

If you encounter issues:
1. Check Railway logs
2. Check Vercel build logs
3. Verify all environment variables
4. Test backend health endpoint directly
5. Check Supabase connection in backend logs

---

**Deployment Date**: January 2025
**Last Updated**: Fresh deployment guide
**Status**: Ready for production deployment
