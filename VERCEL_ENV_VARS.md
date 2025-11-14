# Vercel Environment Variables Configuration

Copy these variables to your Vercel dashboard: **Settings → Environment Variables**

> **Important**: Add these to **Production**, **Preview**, and **Development** environments

---

## 🗄️ Database Configuration

```
NODE_ENV=production
```

```
DATABASE_URL=postgresql://neondb_owner:npg_Q0TaYE9kNbGF@ep-restless-smoke-a1wi0n2q-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

```
DB_HOST=ep-restless-smoke-a1wi0n2q-pooler.ap-southeast-1.aws.neon.tech
```

```
DB_PORT=5432
```

```
DB_NAME=neondb
```

```
DB_USER=neondb_owner
```

```
DB_PASSWORD=npg_Q0TaYE9kNbGF
```

```
DB_DIALECT=postgres
```

```
ENABLE_DB_SYNC=true
```

> **Note**: After first successful deployment, change `ENABLE_DB_SYNC` to `false`

---

## 🔐 JWT Configuration (Production Secrets)

```
JWT_SECRET=nKXuVK0MxDMTgGD7nO2j6PjXVB6HrxNcRjjYhei+S0NYBTwsyImeWl4NGR4rMdKDFPqVQNro9cs9PHff1E5S5Q==
```

```
JWT_EXPIRE=24h
```

```
JWT_REFRESH_SECRET=U+ar2qRUGI+xTVU7FX95M/ibrHwz7or4jMb/hfL084zLIgDjreQQ5A1Bq9RdrDG0sy/30lI3Z/Kn/3MP5HjbrQ==
```

```
JWT_REFRESH_EXPIRE=7d
```

---

## 🌐 CORS & Frontend Configuration

```
CORS_ORIGIN=https://gersl-management.vercel.app
```

```
FRONTEND_URL=https://gersl-management.vercel.app
```

```
VITE_API_URL=https://gersl-management.vercel.app/api
```

> **Note**: Replace `gersl-management.vercel.app` with your actual Vercel domain after deployment

---

## ⚡ Rate Limiting

```
RATE_LIMIT_WINDOW=15
```

```
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 📁 File Upload

```
MAX_FILE_SIZE=5242880
```

---

## 🤖 AI Configuration (Optional but Recommended)

```
GROQ_API_KEY=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
```

```
GEMINI_API_KEY=AIzaSyDgi7QYCX5QRRwnlfSjo9c2MiZthRI8eNY
```

---

## 📧 Email Configuration (Optional - for future use)

```
SMTP_HOST=smtp.gmail.com
```

```
SMTP_PORT=587
```

```
SMTP_USER=your_email@gmail.com
```

```
SMTP_PASSWORD=your_app_password
```

```
EMAIL_FROM=noreply@gersl.org
```

---

## ✅ Quick Checklist

- [ ] All database variables added
- [ ] JWT secrets configured
- [ ] CORS_ORIGIN and FRONTEND_URL added (update after deployment)
- [ ] VITE_API_URL added (update after deployment)
- [ ] Rate limiting configured
- [ ] AI API keys added (if using AI features)
- [ ] All variables applied to: Production, Preview, Development
- [ ] Saved in Vercel dashboard

---

## 🚀 After Adding Variables

1. **Push latest code to GitHub** (if you haven't already)
2. **Trigger deployment** in Vercel (or it will auto-deploy)
3. **Monitor deployment logs** for errors
4. **Update CORS URLs** with actual production domain
5. **Test the application**
6. **Change ENABLE_DB_SYNC to false** after first successful deployment

---

## 📌 Important Notes

- **ENABLE_DB_SYNC=true** is needed ONLY for the first deployment to create database tables
- After database schema is created, change it to **ENABLE_DB_SYNC=false** to prevent accidental schema modifications
- The CORS_ORIGIN and FRONTEND_URL placeholders need to be updated with your actual Vercel domain after deployment
- Keep JWT secrets secure - never commit them to git
