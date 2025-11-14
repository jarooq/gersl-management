# Quick Start Deployment Guide

Deploy GERSL Management System in **30 minutes** using Vercel + Railway + Supabase.

---

## Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│  Vercel         │──────▶│  Railway         │──────▶│  Supabase       │
│  (Frontend)     │       │  (Backend API)   │       │  (PostgreSQL)   │
│  React/Vite     │       │  Express/Node.js │       │  Managed DB     │
└─────────────────┘       └──────────────────┘       └─────────────────┘
```

---

## Prerequisites

- [x] GitHub account
- [x] Local project running successfully
- [ ] Supabase account (free) → https://supabase.com
- [ ] Railway account (free) → https://railway.app
- [ ] Vercel account (free) → https://vercel.com/gersls-projects

---

## 30-Minute Deployment

### Step 1: Supabase (7 minutes)

1. Create project at https://supabase.com/dashboard
2. Save database password
3. Get connection string from Settings → Database
4. Update local `server/.env`:
   ```env
   DB_HOST=aws-0-[region].pooler.supabase.com
   DB_PORT=6543
   DB_NAME=postgres
   DB_USER=postgres.[project-ref]
   DB_PASSWORD=your-password
   DB_DIALECT=postgres
   ENABLE_DB_SYNC=true
   ```
5. Run `cd server && npm run dev` to create tables
6. Verify tables in Supabase → Table Editor

### Step 2: Railway Backend (10 minutes)

1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select repository
3. Configure:
   - Root Directory: `server`
   - Start Command: `npm start`
4. Add environment variables (copy from SUPABASE_SETUP_COMPLETE.md)
5. Deploy and copy Railway URL

### Step 3: Vercel Frontend (8 minutes)

1. Run: `npx vercel --prod`
2. Follow prompts (select `gersls-projects` account)
3. Add environment variable:
   ```bash
   npx vercel env add VITE_API_URL production
   # Enter: https://your-app.up.railway.app/api
   ```
4. Redeploy: `npx vercel --prod`
5. Copy Vercel URL

### Step 4: Configure CORS (2 minutes)

1. Go to Railway → Variables
2. Update:
   ```
   CORS_ORIGIN=https://your-vercel-url.vercel.app
   FRONTEND_URL=https://your-vercel-url.vercel.app
   ```

### Step 5: Create Admin User (3 minutes)

1. Generate hash:
   ```bash
   ./scripts/generate-admin-password-hash.sh "YourPassword123!"
   ```
2. Run SQL in Supabase → SQL Editor:
   ```sql
   INSERT INTO "Users" (username, email, password, "fullName", role, status, "createdAt", "updatedAt")
   VALUES ('admin', 'admin@gersl.org', '$2a$10$YOUR_HASH', 'System Administrator', 'Super Admin', 'Active', NOW(), NOW());
   ```

---

## You're Live! 🎉

Open your Vercel URL and login with:
- Username: `admin`
- Password: (whatever you used)

---

## Helper Scripts

```bash
# Generate JWT secrets
./scripts/generate-jwt-secrets.sh

# Generate admin password hash
./scripts/generate-admin-password-hash.sh "YourPassword"

# Test Railway backend
./scripts/test-railway-backend.sh https://your-app.up.railway.app

# Deploy frontend
./scripts/deploy-frontend.sh
```

---

## Detailed Guides

- **Complete Guide**: SUPABASE_SETUP_COMPLETE.md
- **Checklist**: DEPLOYMENT_CHECKLIST.md

---

## Costs

- **Vercel**: Free (100GB bandwidth)
- **Supabase**: Free (500MB database)
- **Railway**: $5/month credit
- **Total**: ~$0-5/month

---

## Support

- Supabase not connecting? Check password and port (6543)
- Frontend can't reach backend? Verify CORS_ORIGIN
- Login fails? Confirm admin user exists in Supabase

**Need detailed help?** See SUPABASE_SETUP_COMPLETE.md
