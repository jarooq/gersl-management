# Production Deployment Guide

**Date:** November 7, 2025
**Application:** GERSL Management System
**Version:** 1.0.0

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Server Requirements](#server-requirements)
3. [Deployment Options](#deployment-options)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [Post-Deployment](#post-deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Readiness
- [ ] All features tested locally
- [ ] Frontend-backend integration complete
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation complete

### Security
- [ ] SSL certificate obtained
- [ ] Environment variables configured
- [ ] Secrets rotated from defaults
- [ ] Security scan completed
- [ ] Dependencies updated

### Database
- [ ] Production database created
- [ ] Migrations ready
- [ ] Backup strategy defined
- [ ] Connection tested

### Infrastructure
- [ ] Server provisioned
- [ ] Domain name configured
- [ ] DNS records set
- [ ] Firewall rules defined

---

## Server Requirements

### Minimum Requirements (Small Deployment)
- **CPU:** 2 cores
- **RAM:** 2 GB
- **Storage:** 20 GB SSD
- **OS:** Ubuntu 20.04 LTS or newer
- **Network:** 100 Mbps

**Estimated Cost:** $10-20/month
**Supports:** ~100 concurrent users, 10,000 beneficiaries

### Recommended Requirements (Medium Deployment)
- **CPU:** 4 cores
- **RAM:** 8 GB
- **Storage:** 100 GB SSD
- **OS:** Ubuntu 22.04 LTS
- **Network:** 1 Gbps

**Estimated Cost:** $40-80/month
**Supports:** ~500 concurrent users, 50,000 beneficiaries

### Software Requirements
- Node.js 18+ LTS
- PostgreSQL 14+
- Nginx (reverse proxy)
- PM2 (process manager)
- Git
- Certbot (SSL certificates)

---

## Deployment Options

### Option 1: Cloud Platforms (Recommended)

#### A. **Vercel (Frontend) + Heroku (Backend)**
**Pros:**
- Zero DevOps required
- Auto-scaling
- Free SSL
- CI/CD built-in

**Cons:**
- Vendor lock-in
- Higher cost at scale

**Monthly Cost:** $0-50

**Frontend (Vercel):**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd /path/to/gersl-management
vercel

# Follow prompts
# Set environment variables in Vercel dashboard
```

**Backend (Heroku):**
```bash
# Install Heroku CLI
# Download from https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
cd server
heroku create gersl-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Deploy
git push heroku main

# Set environment variables
heroku config:set JWT_SECRET=your_secret_here
heroku config:set NODE_ENV=production
```

#### B. **DigitalOcean App Platform**
**Pros:**
- Simple deployment
- Managed database
- Auto-scaling
- Good pricing

**Cons:**
- Slightly more expensive than DIY

**Monthly Cost:** $12-50

**Steps:**
1. Create DigitalOcean account
2. Create App from GitHub repo
3. Configure build settings
4. Add managed PostgreSQL database
5. Set environment variables
6. Deploy

#### C. **AWS (Frontend: S3+CloudFront, Backend: EC2/ECS)**
**Pros:**
- Enterprise-grade
- Highly scalable
- Full control

**Cons:**
- Complex setup
- Requires DevOps knowledge

**Monthly Cost:** $30-200+

---

### Option 2: VPS Deployment (Full Control)

**Providers:** DigitalOcean, Linode, Vultr, Hetzner

**Pros:**
- Full control
- Lower cost
- No vendor lock-in

**Cons:**
- Manual setup
- Self-managed

**Monthly Cost:** $10-40

---

## Step-by-Step Deployment (VPS)

### Step 1: Server Setup

```bash
# SSH into server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install Nginx
apt install -y nginx

# Install PM2
npm install -g pm2

# Install Certbot (SSL)
apt install -y certbot python3-certbot-nginx

# Create deployment user
adduser deploy
usermod -aG sudo deploy
```

### Step 2: Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE gersl_db;
CREATE USER gersl_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE gersl_db TO gersl_user;
\q

# Configure PostgreSQL for remote access (if needed)
sudo nano /etc/postgresql/14/main/postgresql.conf
# Uncomment and change: listen_addresses = '*'

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Add: host gersl_db gersl_user 0.0.0.0/0 md5

sudo systemctl restart postgresql
```

### Step 3: Clone and Setup Backend

```bash
# Switch to deploy user
su - deploy

# Clone repository
git clone https://github.com/your-org/gersl-management.git
cd gersl-management/server

# Install dependencies
npm install --production

# Create .env file
nano .env
```

**Backend .env:**
```env
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gersl_db
DB_USER=gersl_user
DB_PASSWORD=your_strong_password

# JWT (CHANGE THESE!)
JWT_SECRET=your_very_strong_secret_minimum_32_characters
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=another_very_strong_secret_different_from_above
JWT_REFRESH_EXPIRE=7d

# CORS
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880
```

```bash
# Initialize database
npm run seed

# Start with PM2
pm2 start src/server.js --name gersl-api
pm2 save
pm2 startup
```

### Step 4: Build and Setup Frontend

```bash
# Build frontend
cd ~/gersl-management
npm install
npm run build

# Frontend will be in dist/ folder
```

### Step 5: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/gersl
```

**Nginx Configuration:**
```nginx
# Backend API
upstream backend {
    server localhost:3000;
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    root /home/deploy/gersl-management/dist;
    index index.html;

    # Frontend routing (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://backend;
    }

    # Uploaded files
    location /uploads {
        alias /home/deploy/gersl-management/server/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/gersl /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 6: SSL Certificate (HTTPS)

```bash
# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

### Step 7: Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Check status
sudo ufw status
```

### Step 8: Set Up Automated Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-gersl.sh
```

**Backup Script:**
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/gersl"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U gersl_user gersl_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /home/deploy/gersl-management/server/uploads

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-gersl.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-gersl.sh >> /var/log/gersl-backup.log 2>&1
```

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Check backend is running
curl https://yourdomain.com/health

# Check frontend
curl https://yourdomain.com

# Check API
curl https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

### 2. Create Admin User

```bash
# SSH into server
cd ~/gersl-management/server
node -e "
const { User } = require('./src/models');
User.create({
  username: 'admin',
  email: 'admin@gersl.org',
  password: 'ChangeThisPassword123!',
  fullName: 'System Administrator',
  role: 'Admin',
  status: 'Active'
}).then(() => console.log('Admin created')).catch(console.error);
"
```

### 3. Configure Monitoring

**Option A: PM2 Monitoring (Free)**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

**Option B: External Monitoring**
- **UptimeRobot:** Free uptime monitoring
- **Sentry:** Error tracking ($0-26/month)
- **Datadog:** APM ($0-15/month)

### 4. Set Up Log Rotation

```bash
sudo nano /etc/logrotate.d/gersl
```

```
/var/log/nginx/access.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
}

/home/deploy/.pm2/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
}
```

---

## Monitoring & Maintenance

### Daily Checks
- [ ] Check application uptime
- [ ] Review error logs
- [ ] Check disk space
- [ ] Monitor CPU/RAM usage

### Weekly Tasks
- [ ] Review access logs
- [ ] Check backup status
- [ ] Update dependencies (if needed)
- [ ] Review security alerts

### Monthly Tasks
- [ ] Full system update
- [ ] Backup restoration test
- [ ] Performance review
- [ ] Security scan

### Commands
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs gersl-api

# Check disk space
df -h

# Check memory
free -h

# Check CPU
top

# Restart application
pm2 restart gersl-api

# Database backup manually
/usr/local/bin/backup-gersl.sh
```

---

## Scaling

### Vertical Scaling (Upgrade Server)
```bash
# Increase server resources (CPU, RAM)
# Typically requires server restart
```

### Horizontal Scaling (Multiple Servers)

**Load Balancer Setup:**
```nginx
upstream backend_cluster {
    least_conn;
    server server1.yourdomain.com:3000;
    server server2.yourdomain.com:3000;
    server server3.yourdomain.com:3000;
}
```

**Database Replication:**
- Set up PostgreSQL read replicas
- Configure connection pooling
- Use PgBouncer for connection management

---

## Troubleshooting

### Issue: Application Won't Start

```bash
# Check PM2 logs
pm2 logs gersl-api --err

# Common causes:
# 1. Database connection failed
# 2. Port already in use
# 3. Missing dependencies

# Solution:
pm2 restart gersl-api
```

### Issue: Database Connection Failed

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U gersl_user -d gersl_db -h localhost

# Check .env database credentials
cat ~/gersl-management/server/.env | grep DB_
```

### Issue: SSL Certificate Expired

```bash
# Renew manually
sudo certbot renew

# Check auto-renewal
sudo systemctl status certbot.timer
```

### Issue: High Memory Usage

```bash
# Check PM2 processes
pm2 list

# Restart if needed
pm2 restart all

# Increase swap space if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Issue: Slow Performance

```bash
# Check database queries
# Enable slow query logging in PostgreSQL

# Optimize database
sudo -u postgres psql gersl_db
VACUUM ANALYZE;

# Check indexes
\di
```

---

## Rollback Procedure

### If Deployment Fails

```bash
# 1. Restore database backup
gunzip < /var/backups/gersl/db_YYYYMMDD_HHMMSS.sql.gz | psql -U gersl_user gersl_db

# 2. Checkout previous version
cd ~/gersl-management
git checkout <previous-commit-hash>

# 3. Rebuild frontend
npm run build

# 4. Restart backend
pm2 restart gersl-api

# 5. Clear Nginx cache
sudo nginx -s reload
```

---

## Security Hardening (Production)

### 1. Server Security

```bash
# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no

# Require key-based authentication
# Set: PasswordAuthentication no

sudo systemctl restart sshd

# Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### 2. Database Security

```bash
# Create read-only user for reporting
sudo -u postgres psql
CREATE USER gersl_readonly WITH PASSWORD 'password';
GRANT CONNECT ON DATABASE gersl_db TO gersl_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO gersl_readonly;
```

### 3. Application Security

```bash
# Update server/.env
NODE_ENV=production

# Ensure secrets are strong
JWT_SECRET=<minimum-32-character-random-string>
```

---

## Cost Breakdown

### VPS Deployment (Recommended)

| Item | Provider | Monthly Cost |
|------|----------|--------------|
| **Server** | DigitalOcean Droplet 2GB | $12 |
| **Database Backups** | DigitalOcean Spaces | $5 |
| **Domain** | Namecheap | $1 |
| **SSL Certificate** | Let's Encrypt | Free |
| **Monitoring** | UptimeRobot | Free |
| **Total** | | **$18/month** |

### Cloud Platform Deployment

| Item | Provider | Monthly Cost |
|------|----------|--------------|
| **Frontend** | Vercel | $0-20 |
| **Backend** | Heroku Eco | $5 |
| **Database** | Heroku Mini | $5 |
| **Monitoring** | Sentry (free tier) | $0 |
| **Total** | | **$10-30/month** |

---

## Deployment Checklist

### Pre-Launch
- [ ] Code deployed to server
- [ ] Database migrations run
- [ ] SSL certificate installed
- [ ] Environment variables set
- [ ] Nginx configured
- [ ] PM2 running
- [ ] Firewall configured
- [ ] Backups configured
- [ ] Monitoring set up

### Launch Day
- [ ] Final smoke test
- [ ] DNS updated (if needed)
- [ ] Admin account created
- [ ] Test user flows
- [ ] Monitor error logs
- [ ] Backup taken

### Post-Launch (Week 1)
- [ ] Daily log review
- [ ] Performance monitoring
- [ ] User feedback collection
- [ ] Bug fixes as needed
- [ ] Documentation updates

---

## Support Contacts

**Emergency Contacts:**
- **Server Issues:** hosting-provider-support
- **Domain Issues:** domain-registrar-support
- **Application Issues:** development-team

**Non-Emergency:**
- GitHub Issues
- Email: support@gersl.org

---

## Useful Commands Reference

```bash
# Application Management
pm2 status                    # Check status
pm2 restart gersl-api        # Restart app
pm2 logs gersl-api           # View logs
pm2 monit                    # Monitor resources

# Database
psql -U gersl_user gersl_db  # Connect to DB
pg_dump gersl_db > backup.sql # Manual backup

# Nginx
sudo nginx -t                # Test config
sudo systemctl restart nginx # Restart Nginx
sudo tail -f /var/log/nginx/error.log # View errors

# System
df -h                        # Disk space
free -h                      # Memory usage
top                          # CPU usage
sudo systemctl status <service> # Service status

# Git
git pull origin main         # Update code
git log --oneline -n 5       # Recent commits
git status                   # Check changes

# Updates
sudo apt update              # Update package list
sudo apt upgrade             # Upgrade packages
npm outdated                 # Check npm updates
```

---

**Deployment Status:** Ready for Production
**Estimated Deployment Time:** 2-4 hours
**Recommended Start:** Off-peak hours (weekend)
**Support Required:** Basic Linux knowledge
