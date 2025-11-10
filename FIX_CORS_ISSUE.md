# Fix CORS Issue - Step by Step Guide

**Problem:** Backend is rejecting requests from frontend due to CORS mismatch
**Error:** `CORS header 'Access-Control-Allow-Origin' does not match`

---

## The Issue

Your backend CORS is configured to allow:
```
https://gersl-management.vercel.app
```

But your actual Vercel URL is:
```
https://gersl-management-jarooqs-projects.vercel.app
```

The backend needs to be updated to allow the correct URL.

---

## Solution: Update Render.com Environment Variables

### Option 1: Via Render.com Dashboard (Recommended - 2 minutes)

1. **Open Render.com Dashboard:**
   https://dashboard.render.com

2. **Navigate to your backend service:**
   - Find "gersl-management" or your backend service
   - Click on it

3. **Go to Environment Variables:**
   - Click "Environment" tab in the left sidebar
   - Find these variables:

4. **Update CORS_ORIGIN:**
   - Find: `CORS_ORIGIN`
   - Current value: `https://gersl-management.vercel.app`
   - **Change to:** `https://gersl-management-jarooqs-projects.vercel.app`

5. **Update FRONTEND_URL:**
   - Find: `FRONTEND_URL`
   - Current value: `https://gersl-management.vercel.app`
   - **Change to:** `https://gersl-management-jarooqs-projects.vercel.app`

6. **Save Changes:**
   - Click "Save Changes" button
   - Render will automatically redeploy (takes ~2 minutes)

7. **Wait for Deployment:**
   - Watch the "Logs" tab
   - Wait for "Server started" message
   - Should take 1-2 minutes

---

## Option 2: Allow Multiple Origins (Better for Production)

If you want to allow multiple domains (e.g., both development and production), update the backend code to support multiple origins.

### Update `server/src/server.js` (lines 45-51):

**Current code:**
```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
```

**Replace with:**
```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'https://gersl-management-jarooqs-projects.vercel.app',
  'https://gersl-management.vercel.app',
  process.env.CORS_ORIGIN
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
```

Then:
1. Commit and push changes
2. Render will auto-deploy

---

## Option 3: Temporary - Allow All Origins (NOT for production!)

**Only use this for quick testing:**

Update environment variable on Render.com:
```
CORS_ORIGIN=*
```

⚠️ **Warning:** This allows ANY website to access your API. Only use for testing!

---

## Verification After Fix

Once you've updated the environment variables on Render.com:

### 1. Wait for Render to Redeploy (1-2 minutes)

Watch the logs at: https://dashboard.render.com/web/[your-service-id]/logs

Look for:
```
🚀 ====================================
   GERSL Management API Server
   ====================================
```

### 2. Test the Frontend

Open: https://gersl-management-jarooqs-projects.vercel.app/login

Try to login with:
- Username: `admin`
- Password: `Ger@2025`

### 3. Check Browser Console (F12)

You should NO LONGER see:
```
❌ Cross-Origin Request Blocked: The Same Origin Policy disallows...
```

You SHOULD see:
```
✅ Login successful (or similar success message)
```

---

## Quick Fix Commands (If you want to do it via code)

### Check current Render environment:
```bash
# You'll need to use Render.com dashboard
# Render doesn't have a simple CLI like Vercel
```

---

## Expected Timeline

1. **Update variables on Render.com:** 1 minute
2. **Wait for Render redeploy:** 1-2 minutes
3. **Test login:** 30 seconds
4. **Total:** ~3-4 minutes

---

## What the Error Means

```
CORS header 'Access-Control-Allow-Origin' does not match 'https://gersl-management.vercel.app'
```

Translation:
- Your frontend at `https://gersl-management-jarooqs-projects.vercel.app` is trying to call the API
- The backend only allows requests from `https://gersl-management.vercel.app`
- These don't match → Request blocked by browser security

The browser is protecting users by enforcing the Same-Origin Policy. The backend must explicitly allow the frontend's domain.

---

## After Fixing CORS

Your application will:
- ✅ Load the login page
- ✅ Allow you to enter credentials
- ✅ Successfully call the backend API
- ✅ Get JWT tokens
- ✅ Redirect to dashboard
- ✅ Load all modules

---

## Need Help?

If you encounter issues:

1. **Check Render Logs:**
   https://dashboard.render.com → Your Service → Logs tab

2. **Check Browser Console:**
   F12 → Console tab (look for errors)

3. **Check Network Tab:**
   F12 → Network tab → Look for failed API calls (red)

4. **Test Backend Health:**
   ```bash
   curl https://gersl-management.onrender.com/health
   ```
   Should return: `{"status":"OK",...}`

---

## Summary

**Quick Fix (Recommended):**
1. Go to Render.com dashboard
2. Update `CORS_ORIGIN` to: `https://gersl-management-jarooqs-projects.vercel.app`
3. Save changes
4. Wait 2 minutes for redeploy
5. Test login at: https://gersl-management-jarooqs-projects.vercel.app/login

That's it! Your app should work after this. 🎉
