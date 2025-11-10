#!/bin/bash

# AWS Elastic Beanstalk Deployment Script with Correct Instance Type
# This script will deploy the backend to AWS EB with t3.micro (free tier eligible)

echo "==================================="
echo "AWS Elastic Beanstalk Deployment"
echo "==================================="
echo ""

# Step 1: Check if there's an existing environment and terminate it
echo "Step 1: Checking for existing environments..."
EXISTING_ENV=$(eb list 2>/dev/null | grep gersl-backend-prod || echo "")

if [ -n "$EXISTING_ENV" ]; then
  echo "Found existing environment. You need to manually terminate it via AWS Console:"
  echo "https://console.aws.amazon.com/elasticbeanstalk/home?region=us-east-1#/environment/dashboard?environmentId=e-imqbuirpjr"
  echo ""
  echo "OR wait for it to complete its current operation and run:"
  echo "  eb terminate gersl-backend-prod --force"
  echo ""
  read -p "Press ENTER once the environment is terminated..."
fi

# Step 2: Create new environment with correct instance type
echo ""
echo "Step 2: Creating new EB environment with t3.micro (Free Tier eligible)..."
echo ""

eb create gersl-backend-prod \
  --instance-type t3.micro \
  --region us-east-1 \
  --timeout 20

echo ""
echo "==================================="
echo "Deployment Status"
echo "==================================="
echo ""

# Check final status
eb status

echo ""
echo "If successful, your backend URL will be:"
echo "https://gersl-backend-prod.eba-tahexb3p.us-east-1.elasticbeanstalk.com"
echo ""
echo "Next steps:"
echo "1. Test the backend: curl https://gersl-backend-prod.eba-tahexb3p.us-east-1.elasticbeanstalk.com/health"
echo "2. Update frontend VITE_API_URL to: https://gersl-backend-prod.eba-tahexb3p.us-east-1.elasticbeanstalk.com/api"
echo "3. Redeploy frontend to Vercel"
echo ""
