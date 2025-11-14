#!/bin/bash

# Deploy Frontend to Vercel
# Usage: ./deploy-frontend.sh

echo "========================================"
echo "Deploying Frontend to Vercel"
echo "========================================"
echo ""

# Check if logged in
if ! npx vercel whoami > /dev/null 2>&1; then
  echo "Not logged in to Vercel. Running login..."
  npx vercel login
fi

echo ""
echo "Deploying to production..."
npx vercel --prod

echo ""
echo "========================================"
echo "Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Add VITE_API_URL environment variable:"
echo "   npx vercel env add VITE_API_URL production"
echo "2. Enter your Railway backend URL when prompted"
echo "3. Redeploy: npx vercel --prod"
echo "========================================"
