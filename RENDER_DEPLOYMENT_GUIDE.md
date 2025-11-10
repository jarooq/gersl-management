# Deploy Backend to Render.com

The Vercel serverless deployment is encountering issues with ES module imports and the complex Express app structure. Render.com is a better fit for this traditional Node.js backend.

## Why Render.com?

- Works with traditional Express.js servers without modifications
- No cold starts (unlike serverless)
- Free tier available
- Automatic deployments from GitHub
- Better for complex applications with many dependencies

## Step-by-Step Deployment

### 1. Create Render Account

1. Go to https://render.com
2. Click "Get Started"
3. Sign up with your GitHub account (jarooq)
4. Authorize Render to access your GitHub repositories

### 2. Create New Web Service

1. Click "New +" button in the top right
2. Select "Web Service"
3. Connect your `gersl-management` repository
4. Click "Connect" next to the repository

### 3. Configure the Service

Fill in the following settings:

**Basic Settings:**
- **Name**: `gersl-backend`
- **Region**: Choose closest to your users (e.g., Oregon, Frankfurt)
- **Branch**: `main`
- **Root Directory**: `server`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node src/server.js`

**Instance Type:**
- Select **Free** (can upgrade later)

### 4. Add Environment Variables

Click "Advanced" and add these environment variables one by one:

```bash
NODE_ENV=production
DB_USE_SQLITE=false
DB_DIALECT=postgres
DB_HOST=db.misihnasjvifnktfpylp.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=Ger@2025
JWT_SECRET=WAwzcc0J/Q7ZI4VzhSjM/ilxZ6Q1J6dHhZ5BHSLxreg7Ef/jNg3gVzizgu8XzaLMPSQVZpuDrhQQJnSgyX3vPg==
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=J2l3tAdj3vhEcyUdr61TjQH5WzrlPJ6kSOpPV8jeO+vwsu96HHfUTC+EGVsiS0+Srfd/RUtiHBuHkJKS2wLz+w==
JWT_REFRESH_EXPIRE=7d
CORS_ORIGIN=https://gersl-management.vercel.app
FRONTEND_URL=https://gersl-management.vercel.app
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
PORT=10000
```

**Important**: The `PORT` variable should be set to `10000` (Render's default).

### 5. Deploy

1. Click "Create Web Service"
2. Render will:
   - Clone your repository
   - Run `npm install` in the `server` directory
   - Start the server with `node src/server.js`
   - Assign you a URL like: `https://gersl-backend.onrender.com`

### 6. Wait for Deployment

- First deployment takes 2-5 minutes
- You'll see real-time logs in the dashboard
- Wait for "Your service is live" message

### 7. Test the Backend

Once deployed, test the API:

```bash
curl https://gersl-backend.onrender.com/api/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-11-10T...",
  "environment": "production"
}
```

### 8. Update Frontend to Use Render Backend

The frontend is currently pointing to the Vercel serverless function. You need to update it to use the Render URL.

#### Option A: Update via Vercel Dashboard

1. Go to https://vercel.com/gersls-projects/gersl-management
2. Click "Settings" tab
3. Click "Environment Variables"
4. Find `VITE_API_URL` (or add it if it doesn't exist)
5. Set value to: `https://gersl-backend.onrender.com/api`
6. Save and redeploy

#### Option B: Update via Vercel CLI

```bash
# Remove old VITE_API_URL if it exists
npx vercel env rm VITE_API_URL production

# Add new VITE_API_URL pointing to Render
printf "https://gersl-backend.onrender.com/api" | npx vercel env add VITE_API_URL production

# Trigger new deployment
npx vercel --prod
```

### 9. Update CORS on Render

After frontend is updated, you might need to update CORS settings:

1. Go to Render dashboard
2. Click on your `gersl-backend` service
3. Go to "Environment" tab
4. Verify `CORS_ORIGIN=https://gersl-management.vercel.app`
5. If you made changes, service will auto-redeploy

### 10. Test the Complete System

1. Visit: https://gersl-management.vercel.app/login
2. Login with:
   - Username: `admin`
   - Password: `Ger@2025`
3. Test various features

## Important Notes

### Free Tier Limitations

- **Spin Down**: Free tier services spin down after 15 minutes of inactivity
- **Spin Up**: Takes 30-50 seconds to wake up on first request
- **Solution**: Upgrade to paid tier ($7/month) for always-on service, or use a cron job to ping the service every 10 minutes

### Monitoring

Render provides:
- Real-time logs
- Metrics (CPU, memory, bandwidth)
- Auto-deploy on git push
- Custom domains (paid plans)

### Keeping Service Awake (Optional)

If you want to prevent spin-down on free tier:

1. Create a GitHub Action or external cron job
2. Ping `https://gersl-backend.onrender.com/api/health` every 10 minutes
3. This keeps the service active

Example GitHub Action (`.github/workflows/keep-alive.yml`):

```yaml
name: Keep Backend Alive
on:
  schedule:
    - cron: '*/10 * * * *'  # Every 10 minutes
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping backend
        run: curl https://gersl-backend.onrender.com/api/health
```

## Troubleshooting

### Issue: Build Failed

**Solution**: Check build logs in Render dashboard. Common issues:
- Missing dependencies in `server/package.json`
- Node version mismatch
- Database connection errors during startup

### Issue: Database Connection Error

**Solution**:
1. Verify all DB_ environment variables are correct
2. Check Supabase database is not paused
3. Test connection from Render logs

### Issue: Port Binding Error

**Solution**: Ensure `PORT=10000` environment variable is set

### Issue: CORS Errors in Browser

**Solution**:
1. Verify `CORS_ORIGIN` matches your Vercel URL exactly
2. No trailing slash in URL
3. Redeploy backend after changes

## Cost Comparison

### Free Tier
- Render Backend: $0/month (with spin-down)
- Vercel Frontend: $0/month
- Supabase DB: $0/month
- **Total**: $0/month

### Recommended Production Setup
- Render Backend: $7/month (always-on, no spin-down)
- Vercel Frontend: $0/month (free tier is fine)
- Supabase DB: $25/month (8GB database, daily backups)
- **Total**: $32/month

## Next Steps After Deployment

1. Test all 19 modules thoroughly
2. Create additional user accounts
3. Import real data (orphans, projects, etc.)
4. Set up monitoring and alerts
5. Configure custom domain (optional)
6. Set up automated backups
7. Review security settings

## Support

If you encounter issues:
1. Check Render logs: Dashboard → Your Service → Logs tab
2. Check Supabase connection: Supabase Dashboard → Database → Connection details
3. Check Vercel logs: Vercel Dashboard → Deployments → Latest → Functions

---

**Deployment Time**: 10-15 minutes
**Difficulty**: Easy
**Recommended**: Yes (much simpler than debugging Vercel serverless issues)
