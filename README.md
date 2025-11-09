# GERSL Management System

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: November 9, 2025

A comprehensive management system for GERSL organization with RBAC, 19+ modules, and modern security.

---

## 🚀 Quick Start

### Admin Credentials
```
URL: http://localhost:5173/login
Username: admin
Password: Ger@2025
```

### Start Development
```bash
# Backend
cd server && node src/server.js

# Frontend (new terminal)
npm run dev
```

📚 **Full Guide**: [QUICK_START.md](QUICK_START.md)

---

## 📋 Documentation

### Deployment Guides
- [⚡ QUICK_DEPLOYMENT.md](QUICK_DEPLOYMENT.md) - **Quick start deployment** (20-30 min)
- [SUPABASE_VERCEL_DEPLOYMENT.md](SUPABASE_VERCEL_DEPLOYMENT.md) - Detailed Supabase + Vercel guide
- [DEPLOYMENT_READY_SUMMARY.md](DEPLOYMENT_READY_SUMMARY.md) - Final deployment report
- [PRE_DEPLOYMENT_CHECKLIST.md](PRE_DEPLOYMENT_CHECKLIST.md) - Pre-deployment checklist

### Setup & Configuration
- [QUICK_START.md](QUICK_START.md) - Development & deployment guide
- [SOCIAL_MEDIA_INTEGRATION_GUIDE.md](SOCIAL_MEDIA_INTEGRATION_GUIDE.md) - Social media setup

---

## 🎯 Features

✅ Dashboard • Orphan Care • Projects • Finance • HR (Onboarding, Appraisal, Attendance)  
✅ CBO Partners • Donors • Proposals • MEAL • Campaigns • Donations  
✅ Social Media • Job Postings • Vendor Calls • Operations • Approvals  
✅ Compliance • Reports • Settings

🔐 **Security**: RBAC (17 roles, 150+ permissions), JWT, Bcrypt, Rate Limiting, CORS, Helmet

---

## 🛠️ Tech Stack

**Frontend**: React 19, Vite 7, Tailwind CSS, React Router v6  
**Backend**: Node.js, Express, Sequelize, SQLite/PostgreSQL, JWT  
**Security**: Helmet, CORS, Rate Limiting, Bcrypt

---

## 🚀 Deployment

### Recommended: Supabase + Vercel
```bash
# Follow the step-by-step guide
See SUPABASE_VERCEL_DEPLOYMENT.md
```

### Alternative: Traditional VPS
```bash
# Quick deploy
./deploy.sh

# Manual
npm run build              # Build frontend
cd server && npm install --production
pm2 start src/server.js --name gersl-backend
```

📚 **Deployment Guides**:
- [Supabase + Vercel](SUPABASE_VERCEL_DEPLOYMENT.md) - Cloud deployment (Recommended)
- [Traditional VPS](DEPLOYMENT_READY_SUMMARY.md) - Self-hosted deployment

---

## 📊 Status

✅ All 19 modules working  
✅ Production build tested  
✅ Security configured  
✅ Admin password: Ger@2025  
✅ Documentation complete

⚠️ **Before Production**: Update .env, enable HTTPS, migrate to PostgreSQL

---

**Ready to Deploy!** 🚀 See documentation for next steps.
