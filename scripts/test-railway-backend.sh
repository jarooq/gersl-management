#!/bin/bash

# Test Railway Backend Deployment
# Usage: ./test-railway-backend.sh https://your-app.up.railway.app

if [ -z "$1" ]; then
  echo "Usage: $0 <railway-url>"
  echo "Example: $0 https://gersl-backend.up.railway.app"
  exit 1
fi

RAILWAY_URL="$1"

echo "========================================"
echo "Testing Railway Backend"
echo "URL: $RAILWAY_URL"
echo "========================================"
echo ""

# Test health endpoint
echo "1. Testing /api/health..."
curl -s "$RAILWAY_URL/api/health" | jq '.'
echo ""

# Test auth endpoint
echo "2. Testing /api/auth/test..."
curl -s "$RAILWAY_URL/api/auth/test" 2>&1 || echo "Not found (expected)"
echo ""

# Test CORS headers
echo "3. Testing CORS headers..."
curl -s -I "$RAILWAY_URL/api/health" | grep -i "access-control"
echo ""

echo "========================================"
echo "Backend test complete!"
echo "========================================"
