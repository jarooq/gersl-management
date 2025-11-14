# Deployment Checklist

Follow this checklist step-by-step to deploy your GERSL Management System.

---

## ☐ Step 1: Create Supabase Project (5 min)

**Actions:**
1. [ ] Go to https://supabase.com/dashboard
2. [ ] Click "New Project"
3. [ ] Name: `gersl-management`
4. [ ] Region: `Southeast Asia (Singapore)`
5. [ ] Generate and save database password
6. [ ] Wait for project to provision (~2 min)

**Save these values:**
```
Supabase Project URL: ___________________________
Database Password: ___________________________
```

---

## ☐ Step 2: Get Supabase Connection Details (2 min)

**Actions:**
1. [ ] Go to Project Settings → Database
2. [ ] Find "Connection pooling" section
3. [ ] Copy connection string

**Save these values:**
```
Connection String: ___________________________
Host: ___________________________
Port: 6543
Database: postgres
User: postgres.___________________________
```

---

## ☐ Step 3: Test Local Connection (3 min)

**Actions:**
1. [ ] Update `server/.env` with Supabase credentials:

```bash
# Copy this template to server/.env
DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.your-project-ref
DB_PASSWORD=your-supabase-password
DB_DIALECT=postgres
ENABLE_DB_SYNC=true
```

2. [ ] Start backend locally:
```bash
cd server
npm run dev
```

3. [ ] Verify output shows: "Database connected successfully"
4. [ ] Go to Supabase → Table Editor
5. [ ] Confirm all 13 tables were created

**Tables created:**
- [ ] Users
- [ ] Orphans
- [ ] Projects
- [ ] Expenses
- [ ] Staff
- [ ] CBOPartners
- [ ] Partners
- [ ] Indicators
- [ ] Reports
- [ ] Proposals
- [ ] OrphanVisitLogs
- [ ] OrphanProgressRatings
- [ ] GeneratedOrphanReports

---

## ☐ Step 4: Generate Production Secrets (1 min)

**Actions:**
1. [ ] Generate JWT secrets:
```bash
./scripts/generate-jwt-secrets.sh
```

**Save these values:**
```
JWT_SECRET: ___________________________
JWT_REFRESH_SECRET: ___________________________
```

---

## ☐ Step 5: Deploy Backend to Railway (10 min)

**Actions:**
1. [ ] Go to https://railway.app
2. [ ] Sign in with GitHub
3. [ ] Click "New Project" → "Deploy from GitHub repo"
4. [ ] Select your repository
5. [ ] Configure:
   - Root Directory: `server`
   - Start Command: `npm start`
   - Build Command: `npm install`

6. [ ] Add ALL environment variables (see SUPABASE_SETUP_COMPLETE.md)
7. [ ] Click "Deploy"
8. [ ] Wait for deployment (~3 min)
9. [ ] Copy Railway URL from Settings → Domains

**Save this value:**
```
Railway Backend URL: ___________________________
```

10. [ ] Test backend:
```bash
curl https://your-app.up.railway.app/api/health
```

11. [ ] Verify response shows "OK"

---

## ☐ Step 6: Login to Vercel (1 min)

**Actions:**
1. [ ] Complete Vercel login if not already done
2. [ ] Verify account: https://vercel.com/gersls-projects

---

## ☐ Step 7: Deploy Frontend to Vercel (5 min)

**Actions:**
1. [ ] Deploy frontend:
```bash
npx vercel --prod
```

2. [ ] When prompted:
   - Set up and deploy? → `Y`
   - Which scope? → `gersls-projects`
   - Link to existing? → `N`
   - Project name? → `gersl-management`
   - Directory? → `.` (press Enter)
   - Override settings? → `N`

3. [ ] Copy the production URL

**Save this value:**
```
Vercel Frontend URL: ___________________________
```

4. [ ] Add environment variable:
```bash
npx vercel env add VITE_API_URL production
```

5. [ ] When prompted, enter: `https://your-app.up.railway.app/api`

6. [ ] Redeploy:
```bash
npx vercel --prod
```

---

## ☐ Step 8: Update CORS Settings (2 min)

**Actions:**
1. [ ] Go to Railway Dashboard → Your Project → Variables
2. [ ] Update these variables:

```
CORS_ORIGIN=https://your-vercel-url.vercel.app
FRONTEND_URL=https://your-vercel-url.vercel.app
```

3. [ ] Wait for Railway to redeploy (~1 min)

---

## ☐ Step 9: Create Admin User (3 min)

**Actions:**
1. [ ] Generate password hash:
```bash
./scripts/generate-admin-password-hash.sh "YourAdminPassword123!"
```

2. [ ] Copy the bcrypt hash

3. [ ] Go to Supabase → SQL Editor → New Query

4. [ ] Run this SQL (replace the hash):
```sql
INSERT INTO "Users" (
  username, email, password, "fullName", role, status, "createdAt", "updatedAt"
) VALUES (
  'admin',
  'admin@gersl.org',
  '$2a$10$YOUR_HASH_HERE',
  'System Administrator',
  'Super Admin',
  'Active',
  NOW(),
  NOW()
);
```

5. [ ] Verify: See "Success" message

**Save this value:**
```
Admin Username: admin
Admin Password: ___________________________
```

---

## ☐ Step 10: Test Full Application (5 min)

**Actions:**
1. [ ] Open: `https://your-vercel-url.vercel.app`
2. [ ] Login with admin credentials
3. [ ] Test these features:
   - [ ] Dashboard loads
   - [ ] Navigate to Orphans page
   - [ ] Try creating a test orphan
   - [ ] Check Projects page
   - [ ] Test user management
   - [ ] Verify data saves correctly

---

## 🎉 Deployment Complete!

### Your Live URLs:

```
Frontend: ___________________________
Backend:  ___________________________
Database: Supabase (managed)
```

### Next Steps:

- [ ] Add custom domain (optional)
- [ ] Enable Supabase backups
- [ ] Set up monitoring alerts
- [ ] Configure email service
- [ ] Add team members

### Costs:

- Vercel: $0/month (free tier)
- Supabase: $0/month (free tier)
- Railway: $5/month credit (free tier)
- **Total: $0-5/month**

---

## Troubleshooting

### Can't connect to database
- Verify Supabase password in Railway
- Check connection string format
- Ensure port is 6543 (pooler)

### Frontend can't reach backend
- Verify VITE_API_URL in Vercel
- Check CORS_ORIGIN in Railway
- Test backend health endpoint

### Login doesn't work
- Verify admin user exists in Supabase
- Check JWT secrets in Railway
- Verify password hash is correct

---

**Need help?** Check [SUPABASE_SETUP_COMPLETE.md](./SUPABASE_SETUP_COMPLETE.md) for detailed instructions.
