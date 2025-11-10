# Update Frontend Environment Variable

## Backend is now deployed at:
**https://server-jarooqs-projects.vercel.app**

## Steps to connect frontend to backend:

### Option 1: Via Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/gersls-projects/gersl-management/settings/environment-variables

2. Find `VITE_API_URL` and click **"Edit"**

3. Change the value to:
   ```
   https://server-jarooqs-projects.vercel.app/api
   ```

4. Click **"Save"**

5. Go to: https://vercel.com/gersls-projects/gersl-management/deployments

6. Click **"Redeploy"**

7. **IMPORTANT**: Uncheck "Use existing Build Cache"

8. Click **"Redeploy"**

### Option 2: Via Vercel CLI (If Option 1 doesn't work)

Run these commands:

```bash
cd /Users/thoufeekmuhammedjarooq/Desktop/gersl-management

# Remove old variable (if it exists)
npx vercel env rm VITE_API_URL production

# Add new variable
printf "https://server-jarooqs-projects.vercel.app/api" | npx vercel env add VITE_API_URL production

# Trigger redeploy
git commit --allow-empty -m "Trigger redeploy with new API URL"
git push
```

## After Redeploy:

Test login at: https://gersl-management.vercel.app/login

- **Username**: `admin`
- **Password**: `Ger@2025`

## Architecture:

- **Frontend**: https://gersl-management.vercel.app
- **Backend**: https://server-jarooqs-projects.vercel.app
- **Database**: Supabase PostgreSQL (pooler connection)

Both frontend and backend are now on Vercel! 🎉
