#!/bin/bash

# Generate Production JWT Secrets
# Run this script to generate secure JWT secrets for production

echo "========================================"
echo "Generating Production JWT Secrets"
echo "========================================"
echo ""

echo "JWT_SECRET:"
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo "$JWT_SECRET"
echo ""

echo "JWT_REFRESH_SECRET:"
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo "$JWT_REFRESH_SECRET"
echo ""

echo "========================================"
echo "Copy these values to Railway environment variables"
echo "========================================"
