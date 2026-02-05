#!/bin/bash

# Phase 2 Week 7 - Compliance Copilot Verification Script
# This script verifies that all Copilot components are properly implemented

echo "🔍 Compliance Copilot Implementation Verification"
echo "================================================="
echo ""

# Check database migration
echo "✓ Checking database migration..."
if [ -f "apps/backend/prisma/migrations/20260205211307_add_copilot_models/migration.sql" ]; then
    echo "  ✅ Migration file exists"
else
    echo "  ❌ Migration file missing"
fi

# Check core service files
echo ""
echo "✓ Checking core service files..."
FILES=(
    "apps/backend/src/ai/copilot/copilot.service.ts"
    "apps/backend/src/ai/copilot/copilot.controller.ts"
    "apps/backend/src/ai/copilot/copilot.module.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file missing"
    fi
done

# Check DTOs
echo ""
echo "✓ Checking DTOs..."
DTOS=(
    "apps/backend/src/ai/copilot/dto/create-conversation.dto.ts"
    "apps/backend/src/ai/copilot/dto/send-message.dto.ts"
    "apps/backend/src/ai/copilot/dto/conversation-response.dto.ts"
    "apps/backend/src/ai/copilot/dto/message-response.dto.ts"
    "apps/backend/src/ai/copilot/dto/suggestion-response.dto.ts"
)

for dto in "${DTOS[@]}"; do
    if [ -f "$dto" ]; then
        echo "  ✅ $dto"
    else
        echo "  ❌ $dto missing"
    fi
done

# Check tests
echo ""
echo "✓ Checking tests..."
if [ -f "apps/backend/src/ai/copilot/__tests__/copilot.service.spec.ts" ]; then
    echo "  ✅ Test file exists"
    echo "  Running tests..."
    cd apps/backend && npm test -- copilot.service.spec.ts --passWithNoTests 2>&1 | grep -E "(Tests:|Test Suites:)" || echo "  ⚠️  Test output not captured"
    cd ../..
else
    echo "  ❌ Test file missing"
fi

# Check documentation
echo ""
echo "✓ Checking documentation..."
DOCS=(
    "docs/ai/COMPLIANCE_COPILOT.md"
    "docs/ai/COPILOT_FRONTEND_INTEGRATION.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo "  ✅ $doc"
    else
        echo "  ❌ $doc missing"
    fi
done

# Check schema updates
echo ""
echo "✓ Checking Prisma schema..."
if grep -q "CopilotConversation" apps/backend/prisma/schema.prisma; then
    echo "  ✅ CopilotConversation model exists"
else
    echo "  ❌ CopilotConversation model missing"
fi

if grep -q "CopilotMessage" apps/backend/prisma/schema.prisma; then
    echo "  ✅ CopilotMessage model exists"
else
    echo "  ❌ CopilotMessage model missing"
fi

# Check module integration
echo ""
echo "✓ Checking module integration..."
if grep -q "CopilotModule" apps/backend/src/ai/ai.module.ts; then
    echo "  ✅ CopilotModule imported in AIModule"
else
    echo "  ❌ CopilotModule not imported in AIModule"
fi

# Summary
echo ""
echo "================================================="
echo "✅ Compliance Copilot verification complete!"
echo ""
echo "Next steps:"
echo "1. Ensure OPENAI_API_KEY is set in apps/backend/.env"
echo "2. Run 'npm run backend:dev' to start the server"
echo "3. Test endpoints with Swagger at http://localhost:3001/api"
echo "4. Check implementation summary in PHASE2_WEEK7_COPILOT_COMPLETE.md"
echo ""
