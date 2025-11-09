# ⚡ Quick Deployment Guide
## GERSL Management System → Supabase + Vercel

**Time to Deploy**: 20-30 minutes
**Difficulty**: Easy
**Cost**: Free tier available

---

## 🎯 What You'll Need

- [ ] GitHub account
- [ ] Supabase account (sign up at https://supabase.com)
- [ ] Vercel account (sign up at https://vercel.com)
- [ ] 30 minutes of your time

---

## Step 1: Push Code to GitHub (5 minutes)

### If you don't have a GitHub repository yet:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Ready for deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/gersl-management.git
git branch -M main
git push -u origin main
```

✅ **Done? Your code is now on GitHub!**

---

## Step 2: Set Up Supabase Database (10 minutes)

### 2.1 Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name**: gersl-management
   - **Database Password**: (Generate a strong one - save it!)
   - **Region**: Choose closest to you
   - **Plan**: Free
4. Click **"Create new project"**
5. Wait 2-3 minutes for setup

### 2.2 Get Database Connection Info

1. Click **Settings** (⚙️ icon) in left sidebar
2. Click **Database**
3. Scroll to **Connection String** section
4. Copy the **URI** format connection string
5. It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

### 2.3 Install PostgreSQL Driver Locally

```bash
cd server
npm install pg pg-hstore
cd ..
```

### 2.4 Update Local Environment

Edit `server/.env` and update these lines:

```bash
DB_USE_SQLITE=false
DB_DIALECT=postgres
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_supabase_password_here
```

### 2.5 Initialize Database

```bash
# Start backend server (it will auto-create tables)
cd server
node src/server.js
```

Wait until you see: `✓ Database synced successfully`

Then press `Ctrl+C` to stop the server.

### 2.6 Create Admin User

```bash
node src/scripts/createAdminUser.js
```

### 2.7 Verify in Supabase

1. Go back to Supabase dashboard
2. Click **Table Editor** in left sidebar
3. You should see tables: Users, Orphans, Projects, etc.
4. Click **Users** table - you should see the admin user

✅ **Done? Database is ready!**

---

## Step 3: Deploy Frontend to Vercel (5 minutes)

### 3.1 Connect GitHub to Vercel

1. Go to https://vercel.com/new
2. Sign up/Login with your GitHub account
3. Click **"Import Git Repository"**
4. Find and select your `gersl-management` repository
5. Click **"Import"**

### 3.2 Configure Build Settings

Vercel should auto-detect Vite. Verify these settings:

- **Framework Preset**: Vite
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.3 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. You'll get a URL like: `https://gersl-management-xxx.vercel.app`

✅ **Done? Frontend is live!**

---

## Step 4: Deploy Backend (Choose One Option)

### Option A: Vercel Serverless (Recommended for Free Tier)

**Note**: This requires some code changes to make backend work as serverless functions.

1. **Create `api/` folder** in project root:
```bash
mkdir -p api
```

2. **Install serverless-http**:
```bash
npm install serverless-http
```

3. **Create `api/server.js`**:
```bash
cat > api/server.js << 'EOF'
import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import database connection
import '../server/src/config/database.js';

// Import routes
import authRoutes from '../server/src/routes/auth.routes.js';
import userRoutes from '../server/src/routes/user.routes.js';
import orphanRoutes from '../server/src/routes/orphan.routes.js';
import projectRoutes from '../server/src/routes/project.routes.js';
import financeRoutes from '../server/src/routes/finance.routes.js';
import hrRoutes from '../server/src/routes/hr.routes.js';
import partnerRoutes from '../server/src/routes/partner.routes.js';
import donorRoutes from '../server/src/routes/donor.routes.js';
import proposalRoutes from '../server/src/routes/proposal.routes.js';
import mealRoutes from '../server/src/routes/meal.routes.js';
import campaignRoutes from '../server/src/routes/campaign.routes.js';
import donationRoutes from '../server/src/routes/donation.routes.js';
import socialMediaRoutes from '../server/src/routes/socialMedia.routes.js';
import jobRoutes from '../server/src/routes/job.routes.js';
import vendorRoutes from '../server/src/routes/vendor.routes.js';
import operationsRoutes from '../server/src/routes/operations.routes.js';
import approvalRoutes from '../server/src/routes/approval.routes.js';
import complianceRoutes from '../server/src/routes/compliance.routes.js';
import reportRoutes from '../server/src/routes/report.routes.js';
import settingRoutes from '../server/src/routes/setting.routes.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orphans', orphanRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/meal', mealRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/api', (req, res) => {
  res.json({ message: 'GERSL Management API' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

export default serverless(app);
EOF
```

4. **Create `vercel.json`** in project root:
```bash
cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "api/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/server.js"
    }
  ]
}
EOF
```

5. **Go to Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

6. **Add these variables**:
```
NODE_ENV=production
DB_USE_SQLITE=false
DB_DIALECT=postgres
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_supabase_password
JWT_SECRET=(generate new: openssl rand -base64 64)
JWT_REFRESH_SECRET=(generate new: openssl rand -base64 64)
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d
CORS_ORIGIN=https://your-vercel-app.vercel.app
FRONTEND_URL=https://your-vercel-app.vercel.app
```

7. **Generate JWT Secrets**:
```bash
# Run this twice to get two different secrets
openssl rand -base64 64
```

8. **Update and Redeploy**:
```bash
git add .
git commit -m "Add serverless backend"
git push
```

Vercel will auto-deploy.

### Option B: Render.com Backend (Easier, No Code Changes)

1. Go to https://render.com
2. Sign up/Login with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your repository
5. Configure:
   - **Name**: gersl-backend
   - **Environment**: Node
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Plan**: Free
6. **Add Environment Variables** (all from `server/.env`)
7. Click **"Create Web Service"**
8. Wait for deployment (5 minutes)
9. Copy your backend URL: `https://gersl-backend.onrender.com`

✅ **Done? Backend is live!**

---

## Step 5: Connect Frontend to Backend (2 minutes)

### Update API Base URL

1. Find where API calls are made in your frontend (usually `src/api/` or `src/config/`)

2. Update API base URL:

```javascript
// If using Vercel Serverless:
const API_BASE_URL = import.meta.env.PROD
  ? 'https://your-app.vercel.app/api'
  : 'http://localhost:3001/api';

// If using Render.com:
const API_BASE_URL = import.meta.env.PROD
  ? 'https://gersl-backend.onrender.com/api'
  : 'http://localhost:3001/api';
```

3. **Commit and push**:
```bash
git add .
git commit -m "Update API URL for production"
git push
```

Vercel will auto-deploy the update.

---

## Step 6: Final Verification (5 minutes)

### Test Your Deployment

1. **Visit your Vercel URL**: `https://your-app.vercel.app`

2. **Test Login**:
   - Username: `admin`
   - Password: `Ger@2025`

3. **Test Features**:
   - [ ] Dashboard loads
   - [ ] Sidebar navigation works
   - [ ] Create a test orphan record
   - [ ] Create a test project
   - [ ] Check user permissions

4. **Check Browser Console**:
   - No CORS errors
   - No API connection errors
   - No authentication errors

5. **Test API Health**:
   - Vercel Serverless: `https://your-app.vercel.app/api/health`
   - Render.com: `https://gersl-backend.onrender.com/api/health`

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-11-09T...",
  "environment": "production"
}
```

✅ **All working? Congratulations! Your app is live! 🎉**

---

## 🐛 Quick Troubleshooting

### Problem: Can't login / Authentication error

**Solution**:
- Check JWT secrets are set in Vercel environment variables
- Ensure CORS_ORIGIN matches your Vercel frontend URL
- Check Vercel logs: Dashboard → Deployments → Latest → Functions

### Problem: CORS error in browser console

**Solution**:
```bash
# Update CORS_ORIGIN in Vercel environment variables
CORS_ORIGIN=https://your-exact-vercel-url.vercel.app

# Then redeploy in Vercel dashboard
```

### Problem: Database connection failed

**Solution**:
- Verify Supabase credentials in Vercel environment variables
- Check Supabase is not paused (free tier pauses after 7 days inactivity)
- Test connection string locally first

### Problem: API returns 404

**Solution**:
- Check `vercel.json` is in project root
- Verify routes in `api/server.js` match frontend API calls
- Check Vercel build logs for errors

### Problem: Render.com backend is slow (first request)

**Explanation**: Free tier has cold starts (~30 seconds for first request after inactivity)

**Solution**: Upgrade to paid plan ($7/month) or use Vercel serverless

---

## 📊 Deployment Summary

### What You Deployed:

- ✅ **Frontend**: Vercel (React app)
- ✅ **Backend**: Vercel Serverless or Render.com
- ✅ **Database**: Supabase (PostgreSQL)
- ✅ **Admin**: admin / Ger@2025
- ✅ **HTTPS**: Automatic with Vercel
- ✅ **Security**: CORS, JWT, Rate Limiting

### Your URLs:

- **Frontend**: https://your-app.vercel.app
- **Backend** (if Render): https://gersl-backend.onrender.com
- **Database**: Supabase Dashboard

### Costs:

- **Free Tier**: $0/month (with limitations)
- **Production Tier**: $25-45/month (recommended)

---

## 🎯 Next Steps

### Immediate:

1. **Change Domain** (optional):
   - Vercel Dashboard → Settings → Domains
   - Add your custom domain (e.g., app.gersl.org)

2. **Create User Accounts**:
   - Login as admin
   - Go to Settings → Users
   - Create accounts for staff

3. **Import Initial Data**:
   - Add orphans
   - Create projects
   - Set up partners/donors

### Week 1:

1. **Monitor Logs**:
   - Vercel: Dashboard → Functions
   - Supabase: Database → Logs
   - Check for errors daily

2. **User Training**:
   - Train staff on system
   - Collect feedback
   - Fix any issues

3. **Backups**:
   - Supabase auto-backups (7 days on free tier)
   - Consider upgrading for longer retention

---

## 📞 Need Help?

### Check Logs:

**Vercel Frontend/Backend**:
```
1. Vercel Dashboard
2. Your Project → Deployments
3. Click latest deployment
4. Click "Functions" or "Build Logs"
```

**Supabase Database**:
```
1. Supabase Dashboard
2. Your Project → Database → Logs
```

### Documentation:
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Full Deployment Guide](SUPABASE_VERCEL_DEPLOYMENT.md)

---

## ✅ Deployment Checklist

Use this to track your progress:

- [ ] Step 1: Code pushed to GitHub
- [ ] Step 2: Supabase project created
- [ ] Step 2: Database connection configured
- [ ] Step 2: Tables created in Supabase
- [ ] Step 2: Admin user created
- [ ] Step 3: Frontend deployed to Vercel
- [ ] Step 4: Backend deployed (Vercel or Render)
- [ ] Step 4: Environment variables configured
- [ ] Step 5: API URL updated in frontend
- [ ] Step 6: Login tested successfully
- [ ] Step 6: Features tested
- [ ] Step 6: No errors in console

---

**🎉 Congratulations! Your GERSL Management System is now live!**

**Time Taken**: ~30 minutes
**Status**: Production Ready
**Version**: 1.0.0

---

**Last Updated**: November 9, 2025
