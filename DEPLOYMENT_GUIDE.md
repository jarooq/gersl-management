# GERSL Management System - Fresh Deployment Guide

**Architecture**: Frontend (Vercel) + Backend (Hostinger VPS) + Database (Supabase)

**Total Cost**: Hostinger VPS cost (varies by plan)

**Deployment Time**: ~45 minutes

---

## Overview

```
┌──────────────────┐
│  Vercel (FREE)   │  ← Frontend (React/Vite)
│  Frontend Only   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Hostinger VPS    │  ← Backend (Node.js/Express)
│  Backend API     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Supabase (FREE)  │  ← Database (PostgreSQL)
│   PostgreSQL     │
└──────────────────┘
```

---

## Prerequisites

- GitHub account
- Vercel account (free tier is fine)
- Hostinger VPS or Cloud hosting with SSH access
- Supabase account (free tier)

---

## Step 1: Setup Supabase Database (5 minutes)

### 1.1 Access Your Supabase Project

**If you have Supabase via Vercel Marketplace** (Recommended):
1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Click on **Integrations** → **Supabase**
3. Select your project or click **"Add Integration"** if not already connected
4. You'll be redirected to Supabase dashboard
5. Your database credentials are automatically managed by Vercel

**If creating a new standalone Supabase project**:
1. Go to: https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name**: `gersl-production`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to you
4. Click **"Create new project"**
5. Wait ~2 minutes for database to provision

### 1.2 Get Database Credentials

**If using Vercel Marketplace Supabase**:
- Database credentials are already in your Vercel project environment variables
- Go to Vercel → Your Project → **Settings** → **Environment Variables**
- Look for variables starting with `SUPABASE_` or check the Supabase integration tab
- You'll need to copy these for your Hostinger VPS backend

**If using standalone Supabase**:
1. Go to **Settings** → **Database**
2. Copy these credentials (you'll need them):
   - **Host**: `aws-X-XX-XXXX-X.pooler.supabase.com`
   - **Port**: `6543` (Pooler for serverless)
   - **Database**: `postgres`
   - **User**: `postgres.[project-ref]`
   - **Password**: [your generated password]

### 1.3 Create Tables

1. Go to **SQL Editor**
2. Click **"New Query"**
3. Open the file `CREATE_ALL_TABLES.sql` from your project root
4. Copy and paste the entire SQL script
5. Click **"Run"**
6. You should see: ✅ Success - 13 tables created

### 1.4 Create Admin User

Run this SQL (replace password hash):

```sql
-- First, generate password hash locally:
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Admin123!', 10).then(console.log)"

INSERT INTO users (
  username, email, password, full_name, role, status, created_at, updated_at
) VALUES (
  'admin',
  'admin@gersl.org',
  '$2a$10$YOUR_HASH_HERE',  -- Replace with generated hash
  'System Administrator',
  'Super Admin',
  'Active',
  NOW(),
  NOW()
);
```

---

## Step 2: Deploy Backend to Hostinger VPS (15 minutes)

### 2.1 Connect to Your Hostinger VPS

```bash
# SSH into your server
ssh root@your-server-ip
```

### 2.2 Install Node.js and PM2

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify installation
node --version  # Should show v20.x
npm --version

# Install PM2 (Process Manager)
npm install -g pm2

# Install Git
apt install -y git
```

### 2.3 Clone and Setup Backend

```bash
# Create application directory
mkdir -p /var/www
cd /var/www

# Clone your repository
git clone https://github.com/jarooq/gersl-management.git
cd gersl-management/server

# Install dependencies
npm install --production

# Create logs directory
mkdir -p logs
```

### 2.4 Create Environment File

Create `/var/www/gersl-management/server/.env` with these variables:

```env
# Server
NODE_ENV=production
PORT=3001

# Database (from Supabase Step 1.2)
DB_HOST=aws-X-XX-XXXX-X.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.YOUR_PROJECT_REF
DB_PASSWORD=YOUR_SUPABASE_PASSWORD
DB_DIALECT=postgres
ENABLE_DB_SYNC=false

# JWT Secrets (generate new ones)
JWT_SECRET=GENERATE_NEW_SECRET_HERE
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=GENERATE_NEW_REFRESH_SECRET_HERE
JWT_REFRESH_EXPIRE=7d

# CORS (update after frontend deployment)
CORS_ORIGIN=https://your-frontend-url.vercel.app
FRONTEND_URL=https://your-frontend-url.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=10000

# AI Features (optional)
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

**Generate JWT Secrets:**
```bash
# Run on your VPS to generate secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('base64'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('base64'))"
```

### 2.5 Start Backend with PM2

```bash
# Navigate to server directory
cd /var/www/gersl-management/server

# Start application with PM2
pm2 start ecosystem.config.cjs

# Configure PM2 to start on boot
pm2 startup
pm2 save

# Check status
pm2 status
pm2 logs gersl-backend
```

### 2.6 Configure Nginx Reverse Proxy

```bash
# Install Nginx
apt install -y nginx

# Create Nginx configuration
nano /etc/nginx/sites-available/gersl-backend
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Or your VPS IP

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/gersl-backend /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx

# Enable Nginx on boot
systemctl enable nginx
```

### 2.7 Setup SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d api.yourdomain.com

# Certbot will auto-renew. Test renewal:
certbot renew --dry-run
```

### 2.8 Test Backend

```bash
# Test locally on VPS
curl http://localhost:3001/api/health

# Test through Nginx
curl http://your-vps-ip/api/health
# or if domain is configured:
curl https://api.yourdomain.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "...",
  "database": {
    "host": "supabase...",
    "dialect": "postgres"
  }
}
```

### 2.9 Note Your Backend URL

Save your backend URL for frontend configuration:
- **With domain**: `https://api.yourdomain.com`
- **With IP only**: `http://your-vps-ip` (not recommended for production)

---

## Step 3: Deploy Frontend to Vercel (10 minutes)

### 3.1 Prepare Environment Variables

Create `.env.production` in the root:

```env
VITE_API_URL=https://api.yourdomain.com/api
# Or if using IP: http://your-vps-ip/api
```

### 3.2 Deploy to Vercel

#### Option A: Using Vercel Dashboard

1. Go to: https://vercel.com
2. Click **"Add New..."** → **"Project"**
3. Import `jarooq/gersl-management`
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `.` (leave as root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://api.yourdomain.com/api` (or `http://your-vps-ip/api`)
6. Click **"Deploy"**

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# When prompted:
# - Set up and deploy? Yes
# - Scope: Select your account
# - Link to existing project? No
# - Project name: gersl-management
# - Directory: ./ (root)
# - Override settings? No
```

### 3.3 Get Frontend URL

After deployment completes:
- Copy your Vercel URL (e.g., `https://gersl-management.vercel.app`)

### 3.4 Update Backend CORS

Go back to your Hostinger VPS:

```bash
# SSH into your server
ssh root@your-server-ip

# Edit environment file
nano /var/www/gersl-management/server/.env
```

Update these lines:
```env
CORS_ORIGIN=https://your-vercel-url.vercel.app
FRONTEND_URL=https://your-vercel-url.vercel.app
```

Restart backend:
```bash
pm2 restart gersl-backend
```

---

## Step 4: Test Full Application (5 minutes)

1. Go to your Vercel URL: `https://your-vercel-url.vercel.app`
2. You should see the login page
3. Login with:
   - **Username**: `admin`
   - **Password**: `Admin123!`
4. Test features:
   - ✅ Dashboard loads
   - ✅ Navigate to different pages
   - ✅ Create a test orphan/project
   - ✅ Data saves to Supabase

---

## Step 5: Useful PM2 Commands for Backend Management

```bash
# View logs
pm2 logs gersl-backend

# Check status
pm2 status

# Restart after code changes
pm2 restart gersl-backend

# Stop backend
pm2 stop gersl-backend

# Start backend
pm2 start gersl-backend

# View detailed info
pm2 show gersl-backend

# Monitor in real-time
pm2 monit
```

## Step 6: Updating Your Backend Code

When you need to update backend code:

```bash
# SSH into your server
ssh root@your-server-ip

# Navigate to project directory
cd /var/www/gersl-management

# Pull latest changes
git pull origin main

# Install any new dependencies
cd server
npm install --production

# Restart the backend
pm2 restart gersl-backend

# Check logs for errors
pm2 logs gersl-backend --lines 50
```

---

## Troubleshooting

### Backend Health Check Fails

**Check PM2 Logs:**
```bash
pm2 logs gersl-backend --lines 100
```

**Common Issues:**
- Wrong Supabase credentials in `.env`
- Missing environment variables
- Port 3001 already in use
- Node.js version mismatch
- Missing dependencies (`npm install --production`)

### Frontend Can't Connect to Backend

**Check:**
1. `VITE_API_URL` is set correctly in Vercel
2. CORS settings in backend `.env` match frontend URL
3. Backend is running: `pm2 status`
4. Nginx is running: `systemctl status nginx`
5. Firewall allows port 80/443: `ufw status`
6. Backend health endpoint works: `curl http://localhost:3001/api/health`

### Can't Login

**Verify:**
1. Admin user exists in Supabase Users table
2. Password hash is correct
3. Backend logs show authentication attempts: `pm2 logs gersl-backend`
4. JWT secrets are set in `/var/www/gersl-management/server/.env`

**Reset Admin Password:**
```sql
-- Generate new hash:
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('NewPassword123!', 10).then(console.log)"

UPDATE users
SET password = '$2a$10$NEW_HASH_HERE'
WHERE username = 'admin';
```

---

## Cost Breakdown

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Free | $0/month |
| Hostinger VPS | Varies | ~$4-15/month (depending on plan) |
| Supabase | Free | $0/month |
| **Total** | | **~$4-15/month** |

---

## Architecture Benefits

✅ **No Timeout Issues**: Full VPS control with traditional Node.js server

✅ **Better Performance**: Dedicated resources, no cold starts

✅ **Full Control**: SSH access, can configure anything

✅ **Easier Debugging**: Direct access to logs via PM2

✅ **Scalable**: Can upgrade VPS resources as needed

✅ **Cost Effective**: Affordable VPS hosting

✅ **Professional Setup**: Industry-standard architecture with Nginx reverse proxy

---

## Next Steps

After deployment:

1. **Custom Domain** (Optional):
   - Add custom domain in Vercel
   - Update CORS settings in Railway

2. **Monitoring**:
   - Use PM2 monitoring: `pm2 monit`
   - Set up Supabase alerts
   - Consider installing monitoring tools (Netdata, Grafana)

3. **Backups**:
   - Configure Supabase automatic backups
   - Export data regularly

4. **Team Access**:
   - Add team members in Vercel
   - Create SSH keys for additional developers
   - Create additional users in the app

5. **Security**:
   - Configure UFW firewall properly
   - Keep system updated: `apt update && apt upgrade`
   - Monitor PM2 logs for suspicious activity
   - Regularly review Supabase database access logs

---

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs gersl-backend --lines 100`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Check Vercel build logs in dashboard
4. Verify all environment variables
5. Test backend health endpoint: `curl http://localhost:3001/api/health`
6. Check Supabase connection in backend logs

---

**Deployment Date**: January 2025
**Last Updated**: Hostinger VPS deployment guide
**Status**: Ready for production deployment
