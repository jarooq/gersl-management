#!/bin/bash

# Setup Vercel Backend Environment Variables
# Run this after creating the Vercel project

echo "Setting up Vercel backend environment variables..."
echo ""

# Database Configuration
printf "postgresql://postgres.misihnasjvifnktfpylp:Ger@2025@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres" | npx vercel env add DATABASE_URL production
printf "production" | npx vercel env add NODE_ENV production

# JWT Configuration
printf "WAwzcc0J/Q7ZI4VzhSjM/ilxZ6Q1J6dHhZ5BHSLxreg7Ef/jNg3gVzizgu8XzaLMPSQVZpuDrhQQJnSgyX3vPg==" | npx vercel env add JWT_SECRET production
printf "24h" | npx vercel env add JWT_EXPIRE production
printf "J2l3tAdj3vhEcyUdr61TjQH5WzrlPJ6kSOpPV8jeO+vwsu96HHfUTC+EGVsiS0+Srfd/RUtiHBuHkJKS2wLz+w==" | npx vercel env add JWT_REFRESH_SECRET production
printf "7d" | npx vercel env add JWT_REFRESH_EXPIRE production

# CORS Configuration
printf "https://gersl-management.vercel.app" | npx vercel env add CORS_ORIGIN production
printf "https://gersl-management.vercel.app" | npx vercel env add FRONTEND_URL production

# Rate Limiting
printf "15" | npx vercel env add RATE_LIMIT_WINDOW production
printf "100" | npx vercel env add RATE_LIMIT_MAX_REQUESTS production

echo ""
echo "✅ All environment variables added successfully!"
echo ""
