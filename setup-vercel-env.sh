#!/bin/bash

# GERSL Management - Vercel Environment Variables Setup Script
# Run this after logging in to Vercel CLI: npx vercel login

echo "🔧 Setting up Vercel Environment Variables..."
echo ""

# Note: Replace YOUR_VERCEL_URL with your actual Vercel deployment URL
VERCEL_URL="YOUR_VERCEL_URL.vercel.app"

echo "⚠️  IMPORTANT: Update VERCEL_URL variable in this script first!"
echo "   Current VERCEL_URL: $VERCEL_URL"
echo ""
read -p "Have you updated the VERCEL_URL? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Please edit this script and update VERCEL_URL first"
    exit 1
fi

echo "Adding environment variables to Vercel..."
echo ""

# Database Configuration
npx vercel env add NODE_ENV production --yes
npx vercel env add DB_USE_SQLITE production --yes <<< "false"
npx vercel env add DB_DIALECT production --yes <<< "postgres"
npx vercel env add DB_HOST production --yes <<< "db.misihnasjvifnktfpylp.supabase.co"
npx vercel env add DB_PORT production --yes <<< "5432"
npx vercel env add DB_NAME production --yes <<< "postgres"
npx vercel env add DB_USER production --yes <<< "postgres"
npx vercel env add DB_PASSWORD production --yes <<< "Ger@2025"

# JWT Configuration
npx vercel env add JWT_SECRET production --yes <<< "WAwzcc0J/Q7ZI4VzhSjM/ilxZ6Q1J6dHhZ5BHSLxreg7Ef/jNg3gVzizgu8XzaLMPSQVZpuDrhQQJnSgyX3vPg=="
npx vercel env add JWT_EXPIRE production --yes <<< "24h"
npx vercel env add JWT_REFRESH_SECRET production --yes <<< "J2l3tAdj3vhEcyUdr61TjQH5WzrlPJ6kSOpPV8jeO+vwsu96HHfUTC+EGVsiS0+Srfd/RUtiHBuHkJKS2wLz+w=="
npx vercel env add JWT_REFRESH_EXPIRE production --yes <<< "7d"

# CORS Configuration
npx vercel env add CORS_ORIGIN production --yes <<< "https://$VERCEL_URL"
npx vercel env add FRONTEND_URL production --yes <<< "https://$VERCEL_URL"

# Rate Limiting
npx vercel env add RATE_LIMIT_WINDOW production --yes <<< "15"
npx vercel env add RATE_LIMIT_MAX_REQUESTS production --yes <<< "100"

echo ""
echo "✅ Environment variables added successfully!"
echo ""
echo "🚀 Next steps:"
echo "   1. Go to Vercel Dashboard"
echo "   2. Navigate to your project settings"
echo "   3. Verify environment variables are set"
echo "   4. Trigger a new deployment"
echo ""
