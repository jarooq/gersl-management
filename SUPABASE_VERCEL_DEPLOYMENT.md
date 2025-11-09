# 🚀 Supabase + Vercel Deployment Guide
## GERSL Management System

**Last Updated**: November 9, 2025
**Deployment Stack**: Supabase (Database) + Vercel (Frontend & Backend)

---

## 📋 Overview

This guide walks you through deploying the GERSL Management System using:
- **Supabase**: PostgreSQL database with built-in auth and APIs
- **Vercel**: Frontend hosting and serverless backend functions

**Estimated Setup Time**: 30-45 minutes

---

## 🎯 Prerequisites

- ✅ GitHub account
- ✅ Supabase account (free tier available)
- ✅ Vercel account (free tier available)
- ✅ Git installed locally
- ✅ Node.js 16+ installed

---

## Part 1: Supabase Database Setup (15 minutes)

### Step 1: Create Supabase Project

1. **Go to Supabase**: https://supabase.com
2. **Sign up/Login** with GitHub account
3. **Create New Project**:
   - Project Name: `gersl-management`
   - Database Password: Generate a strong password (save it!)
   - Region: Choose closest to your users
   - Pricing Plan: Free (or Pro if needed)

4. **Wait for provisioning** (2-3 minutes)

### Step 2: Get Database Credentials

Once your project is ready:

1. **Go to Project Settings** (⚙️ icon in sidebar)
2. **Click "Database"** in left menu
3. **Copy Connection Info**:

```
Host: db.xxxxxxxxxxxxx.supabase.co
Database name: postgres
Port: 5432
User: postgres
Password: [your password from step 1]
```

4. **Build Connection String**:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

### Step 3: Update Local Database Configuration

1. **Update `server/.env`**:

```bash
# Database Configuration
DB_USE_SQLITE=false
DB_DIALECT=postgres
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_supabase_password

# Alternative: Use full connection string
# DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

2. **Install PostgreSQL Driver**:
```bash
cd server
npm install pg pg-hstore
```

3. **Update `server/src/config/database.js`** (if needed):

```javascript
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = process.env.DB_USE_SQLITE === 'true'
  ? new Sequelize({
      dialect: 'sqlite',
      storage: './database.sqlite',
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

export default sequelize;
```

### Step 4: Initialize Database Schema

1. **Test connection locally**:
```bash
cd server
node -e "import('./src/config/database.js').then(m => m.default.authenticate().then(() => console.log('✅ Connected to Supabase!')).catch(e => console.error('❌ Error:', e)))"
```

2. **Run migrations and create admin user**:
```bash
# From server directory
node src/server.js
# This will auto-sync models and create tables

# Create admin user
node src/scripts/createAdminUser.js
```

3. **Verify in Supabase Dashboard**:
   - Go to Supabase → Table Editor
   - You should see all your tables (Users, Orphans, Projects, etc.)

---

## Part 2: Backend Deployment Options (Choose One)

### Option A: Vercel Serverless Functions (Recommended)

**Pros**: Automatic scaling, integrated with frontend, no server management
**Cons**: Cold starts, function size limits

#### Step 1: Restructure Backend for Serverless

1. **Create `api/` folder in project root**:
```bash
mkdir -p api
```

2. **Create API handler** `api/index.js`:
```javascript
import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Import all your routes
import authRoutes from '../server/src/routes/auth.routes.js';
import userRoutes from '../server/src/routes/user.routes.js';
// ... import all other routes

dotenv.config({ path: '../server/.env' });

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
// ... add all other routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export as serverless function
export default serverless(app);
```

3. **Install serverless-http**:
```bash
npm install serverless-http
```

4. **Create `vercel.json`** in project root:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Option B: Deploy Backend to Render.com (Alternative)

If serverless doesn't work for your use case:

1. **Go to Render.com** and create account
2. **Create New Web Service**
3. **Connect GitHub repository**
4. **Configure**:
   - Name: `gersl-backend`
   - Environment: `Node`
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && node src/server.js`
   - Plan: Free
5. **Add Environment Variables** (all from server/.env)
6. **Deploy**

---

## Part 3: Frontend Deployment to Vercel (10 minutes)

### Step 1: Prepare Frontend

1. **Update API base URL** in `src/config/api.js` (or wherever API calls are made):

```javascript
// If using Vercel serverless functions:
const API_BASE_URL = import.meta.env.PROD
  ? 'https://your-app.vercel.app/api'
  : 'http://localhost:3001/api';

// If using Render.com for backend:
const API_BASE_URL = import.meta.env.PROD
  ? 'https://gersl-backend.onrender.com/api'
  : 'http://localhost:3001/api';

export default API_BASE_URL;
```

2. **Test production build locally**:
```bash
npm run build
npm run preview
```

3. **Commit all changes to Git**:
```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

### Step 2: Deploy to Vercel

1. **Go to Vercel**: https://vercel.com
2. **Sign up/Login** with GitHub
3. **Click "Add New Project"**
4. **Import Git Repository**:
   - Select your `gersl-management` repository
   - Click "Import"

5. **Configure Project**:
   - Framework Preset: `Vite`
   - Root Directory: `./` (leave as is)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

6. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add any frontend env vars if needed (usually none for this project)

7. **Click "Deploy"**

8. **Wait for deployment** (2-3 minutes)

### Step 3: Get Production URL

Once deployed, you'll get a URL like:
```
https://gersl-management-xxx.vercel.app
```

---

## Part 4: Backend Environment Variables

### If Using Vercel Serverless Functions:

1. **Go to Vercel Project Settings**
2. **Click "Environment Variables"**
3. **Add all variables from `server/.env.production.example`**:

```bash
NODE_ENV=production
DB_USE_SQLITE=false
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_supabase_password
JWT_SECRET=your_64_char_secret
JWT_REFRESH_SECRET=your_64_char_refresh_secret
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d
CORS_ORIGIN=https://gersl-management-xxx.vercel.app
FRONTEND_URL=https://gersl-management-xxx.vercel.app
```

4. **Generate new JWT secrets**:
```bash
openssl rand -base64 64
```

5. **Redeploy** after adding env vars

### If Using Render.com for Backend:

1. Add all environment variables in Render.com dashboard
2. Update `CORS_ORIGIN` to your Vercel frontend URL

---

## Part 5: Final Configuration (5 minutes)

### Step 1: Update CORS in Backend

Ensure your backend allows your Vercel frontend URL:

**In `server/src/server.js`** (or `api/index.js` if serverless):

```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://gersl-management-xxx.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Step 2: Update Supabase Security Settings

1. **Go to Supabase Dashboard**
2. **Project Settings → Database → Connection Pooling**
3. **Enable Connection Pooling** (recommended for serverless)

4. **Update Authentication Settings** (if using Supabase Auth):
   - Go to Authentication → URL Configuration
   - Add your Vercel URL to allowed redirect URLs

### Step 3: Test Production Deployment

1. **Visit your Vercel URL**: `https://gersl-management-xxx.vercel.app`
2. **Test login** with admin credentials:
   - Username: `admin`
   - Password: `Ger@2025`
3. **Test key features**:
   - Dashboard loads
   - Create an orphan record
   - Create a project
   - Test permissions with different roles
4. **Check browser console** for errors
5. **Test API calls** in Network tab

---

## 📊 Deployment Checklist

### Before Going Live:

- [ ] Supabase database created and connected
- [ ] All database tables created (run migrations)
- [ ] Admin user created in Supabase database
- [ ] Backend deployed (Vercel serverless or Render.com)
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured in Vercel
- [ ] CORS configured for production URL
- [ ] JWT secrets generated (new, not dev secrets!)
- [ ] Database connection tested
- [ ] Admin login tested on production
- [ ] API endpoints tested on production
- [ ] All 19 modules tested on production

### Security Checklist:

- [ ] NODE_ENV=production
- [ ] Strong JWT secrets (64-char base64)
- [ ] Admin password changed from default ✅ (Ger@2025)
- [ ] Database password secure
- [ ] CORS restricted to your domain only
- [ ] Rate limiting enabled
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] .env files not committed to Git ✅

---

## 🔧 Common Issues & Troubleshooting

### Issue 1: Database Connection Failed

**Error**: `Error: connect ECONNREFUSED` or `authentication failed`

**Solutions**:
1. Verify Supabase credentials are correct
2. Check if IP allowlist is enabled in Supabase (disable for serverless)
3. Ensure `pg` and `pg-hstore` are installed
4. Check environment variables are set in Vercel

**Test connection**:
```javascript
// In Vercel, check logs at: vercel.com/your-project/logs
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
```

### Issue 2: CORS Errors

**Error**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solutions**:
1. Update `CORS_ORIGIN` in environment variables
2. Ensure credentials: true is set
3. Restart Vercel deployment after env var changes

### Issue 3: JWT Token Errors

**Error**: `JsonWebTokenError: invalid signature` or `TokenExpiredError`

**Solutions**:
1. Ensure `JWT_SECRET` matches between frontend API calls and backend
2. Generate new secrets if moved to production
3. Check token expiry settings

### Issue 4: Serverless Function Timeout

**Error**: `Function execution timed out`

**Solutions**:
1. Optimize database queries (add indexes)
2. Enable connection pooling in Supabase
3. Consider switching to Render.com for backend (no timeout limits)
4. Upgrade Vercel plan for longer function execution time

### Issue 5: Environment Variables Not Loading

**Error**: `undefined` when accessing `process.env.VAR_NAME`

**Solutions**:
1. In Vercel, redeploy after adding env vars
2. Check env var names match exactly (case-sensitive)
3. For frontend, prefix with `VITE_` if using Vite
4. Check `.env` file is not committed (should be in .gitignore)

---

## 📈 Monitoring & Maintenance

### Vercel Deployment:

**View Logs**:
```
1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments"
4. Click on latest deployment
5. Click "Functions" to see serverless logs
```

**Monitor Performance**:
- Vercel Analytics (enable in project settings)
- Check function execution times
- Monitor error rates

### Supabase Database:

**View Database Activity**:
```
1. Supabase Dashboard → Database → Logs
2. Monitor slow queries
3. Check connection pool usage
```

**Backups**:
- Free tier: Daily backups (7 day retention)
- Pro tier: Point-in-time recovery

**Monitor Size**:
```
1. Supabase Dashboard → Database → Database
2. Check database size
3. Free tier: 500 MB limit
```

---

## 🎯 Next Steps After Deployment

### Immediate (Day 1):

1. **Create user accounts** for all staff members
2. **Test all 19 modules** in production
3. **Import initial data** (orphans, projects, partners)
4. **Set up monitoring** (Vercel Analytics, Supabase logs)
5. **Document production URLs** and credentials

### Week 1:

1. **User training sessions** with staff
2. **Collect feedback** on performance and bugs
3. **Monitor error logs** daily
4. **Optimize slow queries** if any
5. **Set up automated backups** (if needed beyond Supabase default)

### Month 1:

1. **Review performance metrics**
2. **Optimize bundle size** (ReportsPage is 751 KB)
3. **Consider CDN** for static assets
4. **Review user access** and permissions
5. **Plan feature enhancements**

---

## 💰 Cost Breakdown

### Free Tier (Good for testing):

- **Supabase**: Free
  - 500 MB database
  - 2 GB bandwidth/month
  - 50k monthly active users

- **Vercel**: Free
  - 100 GB bandwidth/month
  - Unlimited serverless function invocations
  - Automatic HTTPS

**Total**: $0/month

### Recommended Production (Scaling):

- **Supabase Pro**: $25/month
  - 8 GB database
  - 50 GB bandwidth
  - Daily backups
  - Point-in-time recovery

- **Vercel Pro**: $20/month (if needed)
  - 1 TB bandwidth
  - Advanced analytics
  - Team collaboration

**Total**: $25-45/month

---

## 📞 Support Resources

### Documentation:
- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Sequelize + PostgreSQL: https://sequelize.org/docs/v6/other-topics/dialect-specific-things/#postgresql

### Community:
- Supabase Discord: https://discord.supabase.com
- Vercel Community: https://github.com/vercel/vercel/discussions

### Your Documentation:
- [Quick Start Guide](QUICK_START.md)
- [Deployment Ready Summary](DEPLOYMENT_READY_SUMMARY.md)
- [Pre-Deployment Checklist](PRE_DEPLOYMENT_CHECKLIST.md)

---

## ✅ Quick Reference Commands

### Local Development:
```bash
# Backend
cd server && node src/server.js

# Frontend
npm run dev
```

### Build & Deploy:
```bash
# Test production build
npm run build
npm run preview

# Deploy (automatic when you push to GitHub)
git add .
git commit -m "Update"
git push origin main
```

### Database Operations:
```bash
# Test Supabase connection
cd server && node -e "import('./src/config/database.js').then(m => m.default.authenticate())"

# Create admin user
cd server && node src/scripts/createAdminUser.js
```

### Environment Variables:
```bash
# Generate new JWT secret
openssl rand -base64 64
```

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Frontend loads at Vercel URL without errors
✅ Admin login works (admin / Ger@2025)
✅ Dashboard displays data
✅ API calls succeed (check Network tab)
✅ Database reads/writes work
✅ All 19 modules accessible
✅ Permissions system working
✅ No CORS errors in console
✅ HTTPS lock icon in browser
✅ Response times under 2 seconds

---

## 🚀 You're Ready to Deploy!

**Current System Status**: ✅ Production Ready

**Your Stack**:
- Database: Supabase (PostgreSQL)
- Hosting: Vercel
- Admin: admin / Ger@2025

**Deployment Time**: ~30-45 minutes

Good luck with your deployment! 🎯

---

**Last Updated**: November 9, 2025
**Version**: 1.0.0
**Author**: GERSL Management System Team
