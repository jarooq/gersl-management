# Vercel Environment Variables Configuration

Complete list of environment variables to add to your Vercel project.

**Project**: https://vercel.com/gersls-projects/gersl-management/settings/environment-variables

---

## 🔐 Generated Production Secrets

### JWT Secrets (Already Generated)

```
JWT_SECRET=u0B4fWy4GRhzrIYtVYabuZk8CzBDFvWYQ+41qLnG7XNX66q5gc8aZGHdLjLRFOmNBDtHs7UFfWeNrAO4aavZOw==

JWT_REFRESH_SECRET=ZXQsARHpKcXmI8bd7iw8z3zjsfYQiM4mwsnaZ8fkWBw3hl+fbwMGFejuYyeS4tKAIT/2rsPrflVLTkwj3YvLrw==
```

---

## 📋 Required Environment Variables

### 1. Supabase Database Configuration

**⚠️ YOU NEED TO PROVIDE THESE VALUES**

Go to Supabase Dashboard → Settings → Database → Connection pooling

```env
DB_HOST=aws-0-[YOUR-REGION].pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.[YOUR-PROJECT-REF]
DB_PASSWORD=[YOUR-SUPABASE-PASSWORD]
DB_DIALECT=postgres
```

**Example:**
```env
DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.abcdefghijk
DB_PASSWORD=your-super-secure-password
DB_DIALECT=postgres
```

---

### 2. Server Configuration

```env
NODE_ENV=production
PORT=3001
```

---

### 3. JWT Configuration (Use Generated Secrets Above)

```env
JWT_SECRET=u0B4fWy4GRhzrIYtVYabuZk8CzBDFvWYQ+41qLnG7XNX66q5gc8aZGHdLjLRFOmNBDtHs7UFfWeNrAO4aavZOw==
JWT_REFRESH_SECRET=ZXQsARHpKcXmI8bd7iw8z3zjsfYQiM4mwsnaZ8fkWBw3hl+fbwMGFejuYyeS4tKAIT/2rsPrflVLTkwj3YvLrw==
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
```

---

### 4. CORS Configuration

```env
CORS_ORIGIN=https://gersl-management.vercel.app
FRONTEND_URL=https://gersl-management.vercel.app
```

---

### 5. Rate Limiting

```env
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

---

### 6. Database Sync

**⚠️ IMPORTANT**: Set to `true` for FIRST deployment only, then change to `false`

```env
ENABLE_DB_SYNC=true
```

After tables are created in Supabase, change to:
```env
ENABLE_DB_SYNC=false
```

---

### 7. AI Features (Optional - Your Existing Keys)

```env
GROQ_API_KEY=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
GEMINI_API_KEY=AIzaSyDgi7QYCX5QRRwnlfSjo9c2MiZthRI8eNY
```

---

### 8. Frontend API URL

**Add this separately for frontend:**

```env
VITE_API_URL=https://gersl-management.vercel.app/api
```

---

## 🚀 How to Add to Vercel

### Method 1: Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/gersls-projects/gersl-management/settings/environment-variables

2. For each variable:
   - Click **Add New**
   - **Key**: Variable name (e.g., `DB_HOST`)
   - **Value**: Your value
   - **Environments**: Select **All** (Production, Preview, Development)
   - Click **Save**

3. After adding all variables, go to **Deployments** tab

4. Click **Redeploy** on the latest deployment

---

## 📝 Complete Variable List (Copy-Paste Ready)

**Replace the `[YOUR-...]` values with your actual Supabase credentials:**

```
DB_HOST=aws-0-[YOUR-REGION].pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.[YOUR-PROJECT-REF]
DB_PASSWORD=[YOUR-SUPABASE-PASSWORD]
DB_DIALECT=postgres
NODE_ENV=production
PORT=3001
JWT_SECRET=u0B4fWy4GRhzrIYtVYabuZk8CzBDFvWYQ+41qLnG7XNX66q5gc8aZGHdLjLRFOmNBDtHs7UFfWeNrAO4aavZOw==
JWT_REFRESH_SECRET=ZXQsARHpKcXmI8bd7iw8z3zjsfYQiM4mwsnaZ8fkWBw3hl+fbwMGFejuYyeS4tKAIT/2rsPrflVLTkwj3YvLrw==
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://gersl-management.vercel.app
FRONTEND_URL=https://gersl-management.vercel.app
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
ENABLE_DB_SYNC=true
GROQ_API_KEY=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
GEMINI_API_KEY=AIzaSyDgi7QYCX5QRRwnlfSjo9c2MiZthRI8eNY
VITE_API_URL=https://gersl-management.vercel.app/api
```

---

## ✅ After Adding Variables

1. **Redeploy**: Go to Deployments → Click "Redeploy" on latest
2. **Wait**: ~2-3 minutes for deployment
3. **Test API**: `curl https://gersl-management.vercel.app/api/health`
4. **Check Supabase**: Go to Table Editor and verify 13 tables were created
5. **Disable Sync**: Change `ENABLE_DB_SYNC` to `false` and redeploy
6. **Create Admin**: Use SQL in Supabase (see VERCEL_SUPABASE_SETUP.md Step 6)

---

## 🆘 What You Need to Provide

To complete the setup, please provide:

### From Supabase Dashboard:

1. **Project Settings → Database → Connection pooling**

   Copy and provide:
   ```
   Host: _________________________________
   Port: 6543
   Database: postgres
   User: postgres._________________________
   Password: _______________________________
   ```

   OR provide the full connection string:
   ```
   postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

---

## 📞 Next Steps

Once you provide your Supabase credentials:

1. ✅ I'll create a script to add all variables to Vercel automatically
2. ✅ We'll test the database connection
3. ✅ Create the admin user
4. ✅ Test the full application

**Please share your Supabase connection details and I'll help you complete the configuration!**
