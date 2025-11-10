# Render.com Quick Deployment Guide

## 🚀 5-Minute Deployment

### Step 1: Sign Up (1 minute)
1. Go to **https://render.com**
2. Click **"Get Started"**
3. Sign up with your **GitHub account** (jarooq)
4. Authorize Render to access your repositories

### Step 2: Create Web Service (2 minutes)
1. Click **"New +"** button (top right)
2. Select **"Web Service"**
3. Click **"Connect repository"** if needed
4. Find and click **"Connect"** next to `gersl-management`

### Step 3: Configure Service (2 minutes)

Fill in these settings:

**Basic Configuration:**
```
Name: gersl-backend
Region: Singapore (closest to your users)
Branch: main
Root Directory: server
Runtime: Node
Build Command: npm install
Start Command: node src/server.js
```

**Instance Type:**
```
Select: Free (512 MB RAM)
```

⚠️ **Note**: Free tier spins down after 15 min inactivity (50s cold start)

### Step 4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

**Option A: Bulk Add (Faster)**
1. Click **"Add from .env"**
2. Open `.env.render` file in your project
3. Copy all contents
4. Paste into the text area
5. Click **"Add Variables"**

**Option B: Manual Add (One by one)**
Copy from `.env.render` file:
- NODE_ENV=production
- DB_USE_SQLITE=false
- DB_DIALECT=postgres
- DB_HOST=db.misihnasjvifnktfpylp.supabase.co
- DB_PORT=5432
- DB_NAME=postgres
- DB_USER=postgres
- DB_PASSWORD=Ger@2025
- JWT_SECRET=WAwzcc0J/Q7ZI4VzhSjM/ilxZ6Q1J6dHhZ5BHSLxreg7Ef/jNg3gVzizgu8XzaLMPSQVZpuDrhQQJnSgyX3vPg==
- JWT_EXPIRE=24h
- JWT_REFRESH_SECRET=J2l3tAdj3vhEcyUdr61TjQH5WzrlPJ6kSOpPV8jeO+vwsu96HHfUTC+EGVsiS0+Srfd/RUtiHBuHkJKS2wLz+w==
- JWT_REFRESH_EXPIRE=7d
- CORS_ORIGIN=https://gersl-management.vercel.app
- FRONTEND_URL=https://gersl-management.vercel.app
- RATE_LIMIT_WINDOW=15
- RATE_LIMIT_MAX_REQUESTS=100
- PORT=10000

**Total: 18 variables**

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Wait 2-3 minutes for deployment
3. Watch the logs for any errors
4. Look for: **"Your service is live 🎉"**

### Step 6: Get Your Backend URL
After deployment completes, you'll get a URL like:
```
https://gersl-backend.onrender.com
```

**Test it:**
```bash
curl https://gersl-backend.onrender.com/health
```

Should return:
```json
{
  "status": "OK",
  "timestamp": "2025-11-10T...",
  "uptime": 123,
  "environment": "production"
}
```

### Step 7: Update Frontend

Now update Vercel to point to your new Render backend:

**Via Vercel Dashboard:**
1. Go to https://vercel.com/gersls-projects/gersl-management
2. Click **"Settings"** → **"Environment Variables"**
3. Add new variable:
   - Name: `VITE_API_URL`
   - Value: `https://gersl-backend.onrender.com/api`
   - Environment: Production
4. Click **"Save"**
5. Go to **"Deployments"** → **"Redeploy"**

**Via CLI:**
```bash
# Add the environment variable
printf "https://gersl-backend.onrender.com/api" | npx vercel env add VITE_API_URL production

# Trigger new deployment
git commit --allow-empty -m "Update API URL to Render backend"
git push origin main
```

### Step 8: Test Complete System
1. Wait 30 seconds for Vercel to redeploy
2. Visit: **https://gersl-management.vercel.app/login**
3. Login with:
   - Username: `admin`
   - Password: `Ger@2025`
4. Test dashboard and features

## ✅ Success Checklist

- [ ] Render.com account created
- [ ] Web service created from GitHub repo
- [ ] All 18 environment variables added
- [ ] Backend deployed successfully
- [ ] Health endpoint returns OK
- [ ] Frontend updated with new API URL
- [ ] Login works
- [ ] Dashboard loads

## 🎯 What You'll Have

**Architecture:**
- Frontend: Vercel (https://gersl-management.vercel.app)
- Backend: Render.com (https://gersl-backend.onrender.com)
- Database: Supabase (PostgreSQL)

**Benefits:**
- Free hosting for both frontend and backend
- Automatic deployments on git push
- HTTPS enabled
- Separate scaling of frontend/backend

## ⚠️ Free Tier Limitations

**Render.com Free Tier:**
- Spins down after 15 minutes of inactivity
- Takes 50 seconds to wake up on first request
- Limited to 512 MB RAM

**Solutions:**
1. **Upgrade to Paid** ($7/month) - No spin down
2. **Use Keep-Alive Service** - Ping every 10 minutes
3. **Switch to Railway/Fly.io** - Better free tiers

## 🔧 Troubleshooting

**Issue: Build Failed**
- Check logs in Render dashboard
- Verify Root Directory is `server`
- Ensure all dependencies are in server/package.json

**Issue: Database Connection Error**
- Check all DB_ environment variables
- Verify Supabase database is not paused
- Check Supabase dashboard for connection status

**Issue: CORS Error**
- Verify CORS_ORIGIN exactly matches Vercel URL
- No trailing slash
- Must be https://

**Issue: 502 Bad Gateway**
- Check PORT=10000 is set
- Verify Start Command is correct
- Check logs for startup errors

## 📞 Need Help?

1. Check Render logs: Dashboard → Your Service → Logs
2. Check GitHub issues
3. Render documentation: https://render.com/docs

---

**Deployment Time**: 5-10 minutes
**Cost**: $0/month (free tier)
**Difficulty**: Easy

Good luck! 🚀
