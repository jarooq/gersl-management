# Disable Vercel Deployment Protection

## Steps to make the backend publicly accessible:

### 1. Go to Backend Settings

Open this URL in your browser:
```
https://vercel.com/gersls-projects/server/settings/deployment-protection
```

### 2. Change Protection Setting

You'll see **"Deployment Protection"** settings.

Currently it's set to: **"All Deployments"** (requires authentication)

Change it to: **"Only Preview Deployments"**

This will:
- ✅ Keep Production deployments PUBLIC (no authentication required)
- ✅ Keep Preview/branch deployments PROTECTED (requires authentication)

### 3. Click "Save"

### 4. Test Backend

After saving, test that the backend is now accessible:

Open in browser:
```
https://server-jarooqs-projects.vercel.app/health
```

You should see JSON response instead of authentication page.

### 5. Verify with Login

Test the login endpoint:
```
https://server-jarooqs-projects.vercel.app/api/auth/login
```

Should return: `{"success":false,"message":"Invalid request"}` (because no credentials sent)

This confirms the backend is accessible!

---

## After Deployment Protection is Disabled:

The frontend at `https://gersl-management.vercel.app` should automatically connect to the backend once you update `VITE_API_URL` and redeploy.

**Backend URL**: `https://server-jarooqs-projects.vercel.app/api`

Let me know once you've disabled the protection, and I'll update the frontend!
