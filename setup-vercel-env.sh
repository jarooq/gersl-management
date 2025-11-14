#!/bin/bash

# ============================================
# Vercel Environment Variables Setup Script
# ============================================
# This script automatically adds all required environment variables to Vercel
# Run this script: ./setup-vercel-env.sh

set -e

echo "🚀 Setting up Vercel environment variables..."
echo ""

# Check if npx is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js"
    exit 1
fi

echo "🔐 Step 1: Login to Vercel (if not already logged in)"
npx vercel login

echo ""
echo "🔗 Step 2: Link to your Vercel project"
npx vercel link --yes

echo ""
echo "📦 Step 3: Adding environment variables..."
echo ""

# Database Configuration
echo "📝 Adding database configuration..."
npx vercel env add NODE_ENV production --yes production <<< "production"
npx vercel env add DATABASE_URL production preview development --yes <<< "postgresql://neondb_owner:npg_Q0TaYE9kNbGF@ep-restless-smoke-a1wi0n2q-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
npx vercel env add DB_HOST production preview development --yes <<< "ep-restless-smoke-a1wi0n2q-pooler.ap-southeast-1.aws.neon.tech"
npx vercel env add DB_PORT production preview development --yes <<< "5432"
npx vercel env add DB_NAME production preview development --yes <<< "neondb"
npx vercel env add DB_USER production preview development --yes <<< "neondb_owner"
npx vercel env add DB_PASSWORD production preview development --yes <<< "npg_Q0TaYE9kNbGF"
npx vercel env add DB_DIALECT production preview development --yes <<< "postgres"
npx vercel env add ENABLE_DB_SYNC production preview development --yes <<< "true"

# JWT Configuration
echo "📝 Adding JWT configuration..."
npx vercel env add JWT_SECRET production preview development --yes <<< "nKXuVK0MxDMTgGD7nO2j6PjXVB6HrxNcRjjYhei+S0NYBTwsyImeWl4NGR4rMdKDFPqVQNro9cs9PHff1E5S5Q=="
npx vercel env add JWT_EXPIRE production preview development --yes <<< "24h"
npx vercel env add JWT_REFRESH_SECRET production preview development --yes <<< "U+ar2qRUGI+xTVU7FX95M/ibrHwz7or4jMb/hfL084zLIgDjreQQ5A1Bq9RdrDG0sy/30lI3Z/Kn/3MP5HjbrQ=="
npx vercel env add JWT_REFRESH_EXPIRE production preview development --yes <<< "7d"

# CORS & Frontend Configuration
echo "📝 Adding CORS and frontend configuration..."
npx vercel env add CORS_ORIGIN production preview development --yes <<< "https://gersl-management.vercel.app"
npx vercel env add FRONTEND_URL production preview development --yes <<< "https://gersl-management.vercel.app"
npx vercel env add VITE_API_URL production preview development --yes <<< "https://gersl-management.vercel.app/api"

# Rate Limiting
echo "📝 Adding rate limiting configuration..."
npx vercel env add RATE_LIMIT_WINDOW production preview development --yes <<< "15"
npx vercel env add RATE_LIMIT_MAX_REQUESTS production preview development --yes <<< "100"

# File Upload
echo "📝 Adding file upload configuration..."
npx vercel env add MAX_FILE_SIZE production preview development --yes <<< "5242880"

# AI Configuration
echo "📝 Adding AI configuration..."
npx vercel env add GROQ_API_KEY production preview development --yes <<< "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"
npx vercel env add GEMINI_API_KEY production preview development --yes <<< "AIzaSyDgi7QYCX5QRRwnlfSjo9c2MiZthRI8eNY"

# Email Configuration (Optional)
echo "📝 Adding email configuration..."
npx vercel env add SMTP_HOST production preview development --yes <<< "smtp.gmail.com"
npx vercel env add SMTP_PORT production preview development --yes <<< "587"
npx vercel env add EMAIL_FROM production preview development --yes <<< "noreply@gersl.org"

echo ""
echo "✅ All environment variables have been added to Vercel!"
echo ""
echo "📌 Next steps:"
echo "1. Update CORS_ORIGIN, FRONTEND_URL, and VITE_API_URL with your actual Vercel domain"
echo "2. Deploy your application: npx vercel --prod"
echo "3. After first deployment, change ENABLE_DB_SYNC to false"
echo ""
echo "🎉 Done!"
