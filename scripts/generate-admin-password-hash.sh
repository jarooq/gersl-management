#!/bin/bash

# Generate bcrypt hash for admin password
# Usage: ./generate-admin-password-hash.sh "YourPassword123!"

if [ -z "$1" ]; then
  echo "Usage: $0 <password>"
  echo "Example: $0 'MySecurePassword123!'"
  exit 1
fi

PASSWORD="$1"

echo "========================================"
echo "Generating bcrypt hash for password"
echo "========================================"
echo ""

# Generate hash using Node.js
HASH=$(node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('$PASSWORD', 10).then(console.log)")

echo "Password: $PASSWORD"
echo ""
echo "Bcrypt Hash:"
echo "$HASH"
echo ""
echo "========================================"
echo "Use this hash in the SQL INSERT statement"
echo "========================================"
