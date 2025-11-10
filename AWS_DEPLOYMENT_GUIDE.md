# AWS Elastic Beanstalk Deployment Guide

## Current Situation

The first deployment attempt to AWS Elastic Beanstalk failed because:
- Used `t2.micro` instance type (no longer Free Tier eligible)
- The environment is stuck in "Launching" state
- Cannot be terminated until it completes its current operation

## Solution: Deploy with Correct Instance Type

### Step 1: Terminate the Failed Environment

You have two options:

**Option A: Via AWS Console (Recommended)**
1. Open: https://console.aws.amazon.com/elasticbeanstalk/home?region=us-east-1
2. Click on "gersl-backend" application
3. Find "gersl-backend-prod" environment
4. Click "Actions" → "Terminate environment"
5. Confirm termination

**Option B: Wait and use CLI**
Wait for the environment to complete its current operation (~10-20 minutes), then run:
```bash
cd /Users/thoufeekmuhammedjarooq/Desktop/gersl-management/server
eb terminate gersl-backend-prod --force
```

### Step 2: Deploy with Correct Instance Type

Once the environment is terminated, run the deployment script:

```bash
cd /Users/thoufeekmuhammedjarooq/Desktop/gersl-management/server
./deploy-eb-fixed.sh
```

Or manually create the environment:
```bash
cd /Users/thoufeekmuhammedjarooq/Desktop/gersl-management/server
eb create gersl-backend-prod --instance-type t3.micro --region us-east-1 --timeout 20
```

The deployment will:
- Create a new EB environment with `t3.micro` (Free Tier eligible)
- Deploy your Node.js backend
- Provide a URL like: `https://gersl-backend-prod.eba-xxxxx.us-east-1.elasticbeanstalk.com`

### Step 3: Test the Deployment

Once deployed, test the backend:
```bash
curl https://gersl-backend-prod.eba-tahexb3p.us-east-1.elasticbeanstalk.com/health
```

Expected response:
```json
{"status":"OK","timestamp":"..."}
```

### Step 4: Update Frontend

Update the frontend environment variable to point to the new AWS backend:

```bash
cd /Users/thoufeekmuhammedjarooq/Desktop/gersl-management

# Remove old variable
npx vercel env rm VITE_API_URL production

# Add new AWS backend URL
printf "https://gersl-backend-prod.eba-tahexb3p.us-east-1.elasticbeanstalk.com/api" | npx vercel env add VITE_API_URL production

# Trigger redeploy
git commit --allow-empty -m "Update API URL to AWS backend"
git push
```

### Step 5: Verify Everything Works

1. Wait for frontend redeploy to complete
2. Open: https://gersl-management-jarooqs-projects.vercel.app/login
3. Login with:
   - Username: `admin`
   - Password: `Ger@2025`

## AWS Free Tier Eligible Instance Types

Current free tier eligible instances in us-east-1:
- `t3.micro` ✅ (Recommended)
- `t3.small`
- `t4g.micro` (ARM-based)
- `t4g.small` (ARM-based)

**Note:** `t2.micro` is NO LONGER free tier eligible!

## Architecture After Deployment

- **Frontend**: Vercel → `https://gersl-management-jarooqs-projects.vercel.app`
- **Backend**: AWS Elastic Beanstalk → `https://gersl-backend-prod.eba-xxxxx.us-east-1.elasticbeanstalk.com`
- **Database**: Supabase PostgreSQL → `aws-1-ap-southeast-2.pooler.supabase.com`

## Troubleshooting

### If deployment fails with "Health: Red"
Check logs:
```bash
eb logs
```

### If database connection fails
Verify environment variables are set:
```bash
eb printenv
```

### If CORS errors occur
Update CORS_ORIGIN in [.ebextensions/nodecommand.config](server/.ebextensions/nodecommand.config:11)

## Alternative: Keep Using Render.com

Your backend is already successfully deployed at:
- **Backend**: `https://gersl-management.onrender.com`
- **Frontend**: `https://gersl-management-jarooqs-projects.vercel.app`
- **Status**: ✅ Working perfectly

If you prefer to keep using Render.com (simpler, already working):
1. No action needed
2. Everything is already configured correctly
3. Login works at: https://gersl-management-jarooqs-projects.vercel.app/login

## Cost Comparison

| Service | Free Tier | Cost After Free Tier |
|---------|-----------|---------------------|
| AWS EB (t3.micro) | 750 hours/month | ~$8/month |
| Render.com | Free (with cold starts) | $7/month (no cold starts) |
| Vercel (Frontend) | Free | Free for personal projects |
| Supabase (DB) | 500MB | Free up to 500MB |

## Need Help?

If you encounter issues:
1. Check AWS EB environment health: `eb status`
2. View logs: `eb logs`
3. Check events: `eb events`
4. Manual AWS Console: https://console.aws.amazon.com/elasticbeanstalk
