#!/bin/bash

# ============================================
# GERSL Management System - Deployment Script
# ============================================
# This script helps prepare the application for deployment

echo "🚀 GERSL Management System - Deployment Helper"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

echo "Step 1: Pre-deployment Checks"
echo "------------------------------"

# Check Node.js version
NODE_VERSION=$(node -v)
print_info "Node.js version: $NODE_VERSION"

# Check npm version
NPM_VERSION=$(npm -v)
print_info "npm version: $NPM_VERSION"

echo ""
echo "Step 2: Install Dependencies"
echo "-----------------------------"
print_info "Installing frontend dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

print_info "Installing backend dependencies..."
cd server
npm install --production
if [ $? -eq 0 ]; then
    print_success "Backend dependencies installed"
    cd ..
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

echo ""
echo "Step 3: Build Frontend"
echo "----------------------"
print_info "Building frontend for production..."
npm run build
if [ $? -eq 0 ]; then
    print_success "Frontend build completed"
    print_info "Build output in: dist/"
else
    print_error "Frontend build failed"
    exit 1
fi

echo ""
echo "Step 4: Security Checks"
echo "-----------------------"

# Check if .env is in .gitignore
if grep -q "^\.env$" .gitignore; then
    print_success ".env is properly ignored in git"
else
    print_warning ".env might not be properly ignored in git"
fi

# Check if database is in .gitignore
if grep -q "\.sqlite" .gitignore; then
    print_success "Database files are properly ignored in git"
else
    print_warning "Database files might not be properly ignored in git"
fi

echo ""
echo "Step 5: Environment Configuration"
echo "-----------------------------------"

# Check if production .env exists
if [ -f "server/.env.production" ]; then
    print_success "Production .env file found"
else
    print_warning "Production .env file not found"
    print_info "Copy server/.env.production.example to server/.env.production"
fi

# Check critical environment variables
if [ -f "server/.env" ]; then
    if grep -q "NODE_ENV=production" server/.env; then
        print_success "NODE_ENV is set to production"
    else
        print_warning "NODE_ENV is not set to production"
        print_info "Update NODE_ENV=production in server/.env"
    fi

    if grep -q "JWT_SECRET=.*your.*" server/.env; then
        print_error "JWT_SECRET still has default value!"
        print_info "Generate new secret: openssl rand -base64 64"
    else
        print_success "JWT_SECRET appears to be configured"
    fi
else
    print_error "server/.env file not found!"
fi

echo ""
echo "Step 6: Database Check"
echo "----------------------"
if [ -f "server/database.sqlite" ]; then
    print_info "SQLite database found (development)"
    print_warning "For production, consider migrating to PostgreSQL or MySQL"
else
    print_info "No local database found"
fi

echo ""
echo "=============================================="
echo "📋 Deployment Checklist Summary"
echo "=============================================="
echo ""
echo "Before deploying to production, ensure:"
echo ""
echo "🔴 Critical (Must Do):"
echo "  1. [ ] Admin password changed from default"
echo "  2. [ ] Update NODE_ENV=production in .env"
echo "  3. [ ] Update CORS_ORIGIN to production domain"
echo "  4. [ ] Generate new JWT secrets for production"
echo "  5. [ ] Set up SSL/HTTPS certificate"
echo "  6. [ ] Configure production database (PostgreSQL/MySQL)"
echo ""
echo "🟡 Recommended:"
echo "  7. [ ] Set up error monitoring (Sentry)"
echo "  8. [ ] Configure automated database backups"
echo "  9. [ ] Set up process manager (PM2)"
echo " 10. [ ] Configure reverse proxy (Nginx)"
echo " 11. [ ] Set up monitoring and alerting"
echo ""
echo "📚 Documentation:"
echo "  - Pre-deployment Checklist: PRE_DEPLOYMENT_CHECKLIST.md"
echo "  - Deployment Summary: DEPLOYMENT_READY_SUMMARY.md"
echo "  - Social Media Guide: SOCIAL_MEDIA_INTEGRATION_GUIDE.md"
echo ""
echo "🎯 Next Steps:"
echo "  1. Review the documentation above"
echo "  2. Update production environment variables"
echo "  3. Deploy dist/ folder to your hosting service"
echo "  4. Deploy server/ folder to your backend server"
echo "  5. Start backend with: pm2 start server/src/server.js --name gersl-backend"
echo ""
print_success "Deployment preparation complete!"
echo ""
