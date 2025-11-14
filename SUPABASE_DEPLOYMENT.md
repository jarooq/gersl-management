# Vercel Frontend + Supabase Backend Deployment Guide

## Architecture
- **Frontend**: Vercel (React/Vite static site)
- **Backend**: Traditional Express server (can run on Railway/Render)
- **Database**: Supabase PostgreSQL (managed, free tier)

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - Name: `gersl-management`
   - Database Password: (Generate or use strong password)
   - Region: Choose closest to your users
4. Wait for project to provision (~2 minutes)

## Step 2: Get Supabase Connection Details

Once your project is ready:

1. Go to **Project Settings** → **Database**
2. Copy the connection details:
   - Host
   - Database name
   - Port
   - User
   - Password

### Connection String Format:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

## Step 3: Update Local Environment

Update `server/.env` with Supabase credentials:

```env
DB_HOST=aws-0-[region].pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.[project-ref]
DB_PASSWORD=your-password-here
DB_DIALECT=postgres
ENABLE_DB_SYNC=true  # For first run to create tables
```

## Step 4: Test Local Connection

```bash
cd server
npm run dev
```

This will:
- Connect to Supabase PostgreSQL
- Create all tables automatically (Sequelize sync)
- Verify connection works

## Step 5: Deploy Backend to Railway/Render

### Option A: Railway (Recommended - Simple)

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Configure:
   - **Root Directory**: `server`
   - **Start Command**: `npm start`
5. Add environment variables (from Step 2)

### Option B: Render

1. Go to https://render.com
2. New Web Service → Connect GitHub
3. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add environment variables

## Step 6: Deploy Frontend to Vercel

1. Make sure you're logged into new Vercel account
2. Run deployment:

```bash
npx vercel --prod
```

3. When prompted, configure:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Add environment variable in Vercel:
   - `VITE_API_URL`: Your Railway/Render backend URL

## Step 7: Update CORS

Update backend environment variables:
- `CORS_ORIGIN`: Your Vercel frontend URL
- `FRONTEND_URL`: Your Vercel frontend URL

## Step 8: Create Admin User

Connect to Supabase and create admin:

1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL:

```sql
-- First, let's generate a bcrypt hash for the password
-- You'll need to generate this externally or use your API

INSERT INTO "Users" (
  username,
  email,
  password,  -- Use bcrypt hashed password
  "fullName",
  role,
  status,
  "createdAt",
  "updatedAt"
) VALUES (
  'admin',
  'admin@gersl.org',
  '$2a$10$...',  -- Replace with actual bcrypt hash
  'System Administrator',
  'Super Admin',
  'Active',
  NOW(),
  NOW()
);
```

## Benefits of This Setup

✅ **Simple Migration**: Keep existing Express backend code
✅ **Supabase PostgreSQL**: Professional managed database
✅ **Vercel Frontend**: Fast, reliable static hosting
✅ **Railway/Render Backend**: Traditional server, no timeout issues
✅ **Free Tiers**: All platforms offer generous free tiers

## Cost Breakdown (Free Tier)

- **Vercel**: Free (hobby plan)
- **Supabase**: Free (up to 500MB database, unlimited API)
- **Railway**: Free ($5 credit/month)
- **Total**: $0/month for small usage

## Alternative: Full Supabase Backend

If you want to go fully serverless with Supabase later, you can:

1. Use Supabase Auto-generated REST API
2. Replace Express routes with Supabase client calls
3. Use Supabase Auth instead of JWT
4. Deploy Edge Functions for custom logic

**Estimated Migration Time**: 4-6 hours

---

**Recommendation**: Start with Express backend on Railway + Supabase DB, then migrate to full Supabase later if needed.
