#!/bin/bash

echo "🔍 Verifying User Management Implementation..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1 (MISSING)"
        return 1
    fi
}

echo "📁 Checking created files..."
echo ""

# Email Module
echo "Email Module:"
check_file "src/email/email.service.ts"
check_file "src/email/email.module.ts"
check_file "src/email/email.service.spec.ts"
echo ""

# Users Module
echo "Users Module:"
check_file "src/users/users.service.ts"
check_file "src/users/users.controller.ts"
check_file "src/users/users.module.ts"
check_file "src/users/dto/user.dto.ts"
check_file "src/users/users.service.spec.ts"
echo ""

# RBAC
echo "RBAC System:"
check_file "src/common/decorators/roles.decorator.ts"
check_file "src/common/guards/roles.guard.ts"
check_file "src/auth/guards/jwt-auth.guard.ts"
echo ""

# Auth Updates
echo "Auth Module Updates:"
check_file "src/auth/auth.service.ts"
check_file "src/auth/auth.controller.ts"
check_file "src/auth/auth.module.ts"
check_file "src/auth/dto/auth.dto.ts"
check_file "src/auth/auth.service.spec.ts"
echo ""

# Database
echo "Database:"
check_file "prisma/schema.prisma"
echo ""

# Documentation
echo "Documentation:"
check_file "docs/USER_MANAGEMENT.md"
check_file "USER_MANAGEMENT_README.md"
echo ""

echo "🔧 Checking environment variables..."
if grep -q "EMAIL_HOST" .env; then
    echo -e "${GREEN}✓${NC} EMAIL_HOST configured"
else
    echo -e "${RED}✗${NC} EMAIL_HOST not configured"
fi

if grep -q "EMAIL_PORT" .env; then
    echo -e "${GREEN}✓${NC} EMAIL_PORT configured"
else
    echo -e "${RED}✗${NC} EMAIL_PORT not configured"
fi

if grep -q "FRONTEND_URL" .env; then
    echo -e "${GREEN}✓${NC} FRONTEND_URL configured"
else
    echo -e "${RED}✗${NC} FRONTEND_URL not configured"
fi

echo ""
echo "✅ Verification complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Start PostgreSQL: docker-compose up postgres -d"
echo "  2. Run migration: npx prisma migrate dev --name add_user_management"
echo "  3. Start backend: npm run backend:dev"
echo "  4. Test endpoints: http://localhost:3001/api"
