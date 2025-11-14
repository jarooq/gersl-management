# GERSL Management System - Vercel All-in-One Deployment

**Only 2 Platforms Needed!**  
**Stack:** Vercel (Frontend + Backend + Database)  
**Platforms:** GitHub + Vercel (that's it!)

---

## Why Vercel All-in-One?

✅ **Truly all-in-one** - Frontend, Backend, and Database on Vercel  
✅ **Only 2 platforms** - GitHub + Vercel (nothing else!)  
✅ **Simple setup** - One dashboard for everything  
✅ **Auto-deployments** - Push to GitHub = instant deploy  
✅ **Professional hosting** - Used by Next.js, OpenAI, and thousands of companies  
✅ **Great free tier** - Perfect for NGOs

---

## What Vercel Provides

| Component | Solution | Cost |
|-----------|----------|------|
| Frontend | Vercel Static Hosting | Free |
| Backend | Vercel Serverless Functions | Free (100 GB-hours) |
| Database | Vercel Postgres | $0.20/month (Hobby) |

**Total:** ~$0.20-0.50/month for hobby use, $20/month for Pro

---

## Prerequisites

### Push Code to GitHub

```bash
cd /Users/thoufeekmuhammedjarooq/Desktop/gersl-management

# Initialize git if needed
git init
git add .
git commit -m "Ready for Vercel deployment"

# Create repo on GitHub, then push
git remote add origin https://github.com/YOUR_USERNAME/gersl-management.git
git push -u origin main
```

---

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

---

## Step 2: Create Vercel Postgres Database

### 2.1 Login to Vercel

```bash
vercel login
```

### 2.2 Go to Vercel Dashboard

1. Open [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Storage" in the top menu
3. Click "Create Database"
4. Select "Postgres"

### 2.3 Configure Database

- **Name:** `gersl-database`
- **Region:** Choose closest to your users
- **Plan:** Hobby ($0.20/month, includes 256MB)

Click "Create"

### 2.4 Get Database Connection String

1. Click your new database
2. Go to "Settings" tab → ".env.local"
3. Copy all the variables - you'll need them!

Should look like:
```
POSTGRES_URL="postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb"
POSTGRES_PRISMA_URL="postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb?pgbouncer=true&connect_timeout=15"
POSTGRES_URL_NON_POOLING="postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb"
POSTGRES_USER="default"
POSTGRES_HOST="xxx.postgres.vercel-storage.com"
POSTGRES_PASSWORD="xxx"
POSTGRES_DATABASE="verceldb"
```

---

## Step 3: Configure Backend for Vercel Functions

### 3.1 Create API Directory Structure

```bash
cd /Users/thoufeekmuhammedjarooq/Desktop/gersl-management

# Create Vercel API directory
mkdir -p api

# Create a catch-all API endpoint
cat > api/[...path].js << 'APIEOF'
import serverless from 'serverless-http';
import '../server/src/server.js';
import app from '../server/src/server.js';

// Export serverless handler
export default serverless(app);
APIEOF
```

### 3.2 Update server/src/server.js

Add this at the very end of the file (after all routes):

```javascript
// Export app for Vercel serverless
export default app;

// Only start server in non-serverless environment
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}
```

### 3.3 Create vercel.json

```bash
cat > vercel.json << 'VERCELEOF'
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/[...path].js"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
VERCELEOF
```

### 3.4 Commit Changes

```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

---

## Step 4: Deploy to Vercel

### 4.1 Initialize Vercel Project

```bash
cd /Users/thoufeekmuhammedjarooq/Desktop/gersl-management
vercel
```

Answer prompts:
```
? Set up and deploy? Yes
? Which scope? (Select your account)
? Link to existing project? No  
? What's your project's name? gersl-management
? In which directory is your code located? ./
? Want to override settings? Yes
  ? Build Command: npm run build
  ? Output Directory: dist
  ? Development Command: npm run dev
```

This creates a preview deployment.

### 4.2 Link Database to Project

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your `gersl-management` project
3. Go to "Settings" → "Storage"
4. Click "Connect" next to your Postgres database
5. Click "Connect Store"

---

## Step 5: Configure Environment Variables

### 5.1 Go to Project Settings

1. Vercel dashboard → Your project
2. Settings → Environment Variables

### 5.2 Add Backend Variables

Click "Add" for each variable (select **Production**, **Preview**, **Development**):

```bash
# Node Environment
NODE_ENV=production

# Database (Auto-configured by Vercel when you connected the database)
# These should already be set:
# POSTGRES_URL
# POSTGRES_USER  
# POSTGRES_HOST
# POSTGRES_PASSWORD
# POSTGRES_DATABASE

# We need to map them to our app's format:
DB_USE_SQLITE=false
DB_DIALECT=postgres
DB_HOST=(copy from POSTGRES_HOST)
DB_PORT=5432
DB_NAME=(copy from POSTGRES_DATABASE)
DB_USER=(copy from POSTGRES_USER)
DB_PASSWORD=(copy from POSTGRES_PASSWORD)
ENABLE_DB_SYNC=true

# JWT Secrets - Generate new ones!
JWT_SECRET=GENERATE_NEW_SECRET
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=GENERATE_NEW_REFRESH_SECRET
JWT_REFRESH_EXPIRE=7d

# CORS (will update after getting URL)
CORS_ORIGIN=*
FRONTEND_URL=*

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880

# AI Keys
GROQ_API_KEY=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
GEMINI_API_KEY=AIzaSyDgi7QYCX5QRRwnlfSjo9c2MiZthRI8eNY
```

### 5.3 Add Frontend Variables

```bash
VITE_API_URL=https://your-project.vercel.app/api
VITE_API_BASE_URL=https://your-project.vercel.app/api
VITE_API_TIMEOUT=30000
```

(You'll update these with your actual URL in next step)

### 5.4 Generate JWT Secrets

On your computer:

```bash
# JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

Copy outputs and update `JWT_SECRET` and `JWT_REFRESH_SECRET` in Vercel.

---

## Step 6: Deploy to Production

### 6.1 Deploy

```bash
vercel --prod
```

Wait for deployment (~3 minutes).

You'll get your production URL:
```
✅ https://gersl-management.vercel.app
```

### 6.2 Update Environment Variables

Go back to Vercel dashboard → Environment Variables and update:

```bash
CORS_ORIGIN=https://gersl-management.vercel.app
FRONTEND_URL=https://gersl-management.vercel.app
VITE_API_URL=https://gersl-management.vercel.app/api
VITE_API_BASE_URL=https://gersl-management.vercel.app/api
```

Replace with YOUR actual Vercel URL!

### 6.3 Redeploy

```bash
vercel --prod
```

This final deployment will use correct URLs.

---

## Step 7: Initialize Database

### 7.1 Run Database Sync

The first deployment should create tables automatically (ENABLE_DB_SYNC=true).

Check Vercel function logs:
1. Dashboard → Functions
2. Look for database sync messages

### 7.2 Create Admin User

Go to Vercel dashboard:
1. Storage → Your Postgres database
2. Click "Query" tab
3. Run this SQL:

```sql
INSERT INTO users (
  username,
  email,
  password,
  "fullName",
  role,
  status,
  department,
  "createdAt",
  "updatedAt"
) VALUES (
  'admin',
  'admin@gersl.org',
  '$2a$10$RZvO8EhON4h6MjHv1YEXiOXJZ7.kJ9X5QXm.Y.wLWxN5vVx5YJMBC',
  'System Administrator',
  'Admin',
  'Active',
  'Executive',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
```

**Admin credentials:**
- Username: `admin`
- Password: `GERAdmin@2025`

### 7.3 Disable Database Sync

After successful first deployment:
1. Vercel dashboard → Environment Variables
2. Find `ENABLE_DB_SYNC`
3. Change to `false`
4. Save (auto-redeploys)

---

## Step 8: Test Deployment! 🎉

### 8.1 Test Backend API

```bash
curl https://your-url.vercel.app/api/health
```

Should return:
```json
{
  "status": "OK",
  "timestamp": "...",
  "environment": "production"
}
```

### 8.2 Login to App

1. Visit `https://your-url.vercel.app`
2. Login:
   - Username: `admin`
   - Password: `GERAdmin@2025`
3. ✅ Should reach dashboard!

### 8.3 Test Fixed Features

**Test 1: User Creation (Was Broken!)**
1. Settings → User Management → Add User
2. Leave department empty
3. ✅ Should work without 500 error!

**Test 2: No 401 Errors (Was Broken!)**
1. Open console (F12)
2. Navigate pages
3. ✅ No 401 errors!

### 8.4 Change Password

Click profile → Settings → Change password

---

## Troubleshooting

### Function Errors

**Check Vercel Function Logs:**
1. Dashboard → Functions tab
2. Click failing function
3. Review error logs

**Common issues:**
- Database connection failed → Check environment variables match Postgres connection
- Timeout error → Functions have 10s limit on Hobby plan

### Database Issues

**Can't connect to database:**
1. Verify database is connected to project (Settings → Storage)
2. Check environment variables are set
3. Try the "Test Connection" in Vercel Postgres dashboard

### Frontend Issues

**Network errors:**
1. Check `VITE_API_URL` ends with `/api`
2. Test backend: `curl https://your-url.vercel.app/api/health`
3. Check browser console for CORS errors

---

## Costs

### Vercel Hobby (Personal Projects)

| Resource | Limit | Cost |
|----------|-------|------|
| Bandwidth | 100 GB/month | Free |
| Function Execution | 100 GB-hours | Free |
| Build Minutes | 6,000/month | Free |
| **Postgres Database** | 256 MB, 60 hours compute | **$0.20/month** |

**Total:** ~$0.20-0.50/month

### Vercel Pro (Production)

| Resource | Limit | Cost |
|----------|-------|------|
| Everything Unlimited | Much higher limits | $20/month |
| Postgres | 256 MB included | Included |

### Typical NGO Usage

With 50 users, 1000 requests/day:
- Bandwidth: ~5-10 GB/month ✅
- Functions: ~10-20 GB-hours ✅
- Database: 256 MB plenty ✅

**You'll stay well within Hobby tier!**

---

## Automatic Deployments

Every `git push` triggers auto-deployment:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main
```

Vercel:
1. Detects push
2. Builds frontend + backend
3. Deploys to production
4. Sends email notification

Takes ~3 minutes automatically!

---

## Managing Your Deployment

### View Logs

**Function Logs:**
- Dashboard → Functions → Click function → Logs

**Build Logs:**
- Dashboard → Deployments → Click deployment → Build Logs

### Database Management

**Query Data:**
- Dashboard → Storage → Your database → Query tab

**View Tables:**
- Dashboard → Storage → Your database → Data tab

**Backups:**
- Automatic daily backups on Hobby plan
- Manual backups in Settings

### Rollback Deployment

1. Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → Promote to Production

---

## Post-Deployment Checklist

### Security
- [ ] Changed admin password
- [ ] Generated new JWT secrets
- [ ] CORS restricted to exact domain
- [ ] Database backups enabled

### Data
- [ ] Created team user accounts
- [ ] Imported existing orphan data
- [ ] Tested approval workflows

### Optional
- [ ] Custom domain (Vercel supports free)
- [ ] Email SMTP configuration
- [ ] Vercel Analytics enabled

---

## Custom Domain (Optional)

### Add Your Domain

1. Dashboard → Settings → Domains
2. Add domain (e.g., `gersl.org`)
3. Follow DNS instructions
4. Update environment variables with new domain

Free SSL certificate included!

---

## Summary

**Your GERSL System is LIVE on Vercel!** 🎉

### Architecture

```
┌─────────────────────────────────────┐
│          GitHub (Code)              │
└────────────┬────────────────────────┘
             │ Auto-deploy on push
             ▼
┌─────────────────────────────────────┐
│         VERCEL (All-in-One)         │
├─────────────────────────────────────┤
│ Frontend: React Static Site         │
│ Backend: Serverless Functions (/api)│
│ Database: Postgres (256MB)          │
└─────────────────────────────────────┘
```

### URLs

- **App:** `https://your-project.vercel.app`
- **API:** `https://your-project.vercel.app/api`
- **Health:** `https://your-project.vercel.app/api/health`

### Platforms Used

1. **GitHub** - Code repository
2. **Vercel** - Everything else (frontend + backend + database)

**That's it! Only 2 platforms!**

### All Bugs Fixed ✅

- ✅ User creation works (ENUM bug fixed)
- ✅ No 401 loops (auto-loading disabled)
- ✅ Environment variables configured
- ✅ Production ready

### Cost

**~$0.20-0.50/month** (Vercel Hobby + Postgres)

Perfect for NGO use!

---

## Next Steps

1. **Login** and change admin password
2. **Create users** for your team
3. **Import data** (if you have existing records)
4. **Enjoy** your deployed system!

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Vercel Postgres:** https://vercel.com/docs/storage/vercel-postgres
- **Community:** https://vercel.com/discord

**Congrats on deploying to Vercel!** 🚀

