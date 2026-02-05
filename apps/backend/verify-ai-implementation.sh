#!/bin/bash
# AI Evidence Mapping - Implementation Verification Script

echo "🔍 Verifying AI Evidence Mapping Implementation..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check counter
CHECKS_PASSED=0
CHECKS_TOTAL=0

check() {
    ((CHECKS_TOTAL++))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

echo "📦 1. Dependencies"
npm list openai --depth=0 > /dev/null 2>&1
check $? "openai package installed"

npm list langchain --depth=0 > /dev/null 2>&1
check $? "langchain package installed"

npm list @langchain/openai --depth=0 > /dev/null 2>&1
check $? "@langchain/openai package installed"

npm list zod --depth=0 > /dev/null 2>&1
check $? "zod package installed"

echo ""
echo "📁 2. File Structure"

[ -f "src/ai/ai.module.ts" ]
check $? "ai.module.ts exists"

[ -f "src/ai/openai.service.ts" ]
check $? "openai.service.ts exists"

[ -f "src/ai/prompt.service.ts" ]
check $? "prompt.service.ts exists"

[ -f "src/ai/usage-tracker.service.ts" ]
check $? "usage-tracker.service.ts exists"

[ -f "src/ai/evidence-mapping/evidence-mapping.service.ts" ]
check $? "evidence-mapping.service.ts exists"

[ -f "src/ai/evidence-mapping/evidence-mapping.controller.ts" ]
check $? "evidence-mapping.controller.ts exists"

[ -f "src/ai/evidence-mapping/dto/create-mapping.dto.ts" ]
check $? "create-mapping.dto.ts exists"

[ -f "src/ai/evidence-mapping/dto/update-mapping.dto.ts" ]
check $? "update-mapping.dto.ts exists"

[ -f "src/ai/evidence-mapping/dto/mapping-response.dto.ts" ]
check $? "mapping-response.dto.ts exists"

[ -f "src/ai/__tests__/evidence-mapping.service.spec.ts" ]
check $? "evidence-mapping.service.spec.ts exists"

echo ""
echo "🗄️  3. Database"

[ -f "prisma/schema.prisma" ]
check $? "schema.prisma exists"

grep -q "model EvidenceMapping" prisma/schema.prisma
check $? "EvidenceMapping model defined"

grep -q "model AIPromptTemplate" prisma/schema.prisma
check $? "AIPromptTemplate model defined"

grep -q "model AIUsageLog" prisma/schema.prisma
check $? "AIUsageLog model defined"

[ -f "prisma/seeds/ai-templates.seed.ts" ]
check $? "ai-templates.seed.ts exists"

echo ""
echo "📚 4. Documentation"

[ -f "docs/ai/EVIDENCE_MAPPING.md" ]
check $? "EVIDENCE_MAPPING.md exists"

[ -f "AI_IMPLEMENTATION.md" ]
check $? "AI_IMPLEMENTATION.md exists"

echo ""
echo "⚙️  5. Configuration"

grep -q "OPENAI_API_KEY" .env
check $? "OPENAI_API_KEY in .env"

grep -q "OPENAI_MODEL" .env
check $? "OPENAI_MODEL in .env"

grep -q "OPENAI_MAX_TOKENS" .env
check $? "OPENAI_MAX_TOKENS in .env"

grep -q "AI_CACHE_TTL" .env
check $? "AI_CACHE_TTL in .env"

echo ""
echo "🏗️  6. Build"

npm run build > /dev/null 2>&1
check $? "Backend builds successfully"

echo ""
echo "🧪 7. Tests"

npm test -- src/ai/__tests__/evidence-mapping.service.spec.ts > /dev/null 2>&1
check $? "AI mapping tests pass"

echo ""
echo "📝 8. Module Integration"

grep -q "AIModule" src/app.module.ts
check $? "AIModule imported in app.module.ts"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
if [ $CHECKS_PASSED -eq $CHECKS_TOTAL ]; then
    echo -e "${GREEN}✅ All checks passed! ($CHECKS_PASSED/$CHECKS_TOTAL)${NC}"
    echo ""
    echo "🚀 AI Evidence Mapping is ready for use!"
    echo ""
    echo "Next steps:"
    echo "1. Add your OpenAI API key to .env"
    echo "2. Run: npm run migrate"
    echo "3. Run: npx ts-node prisma/seeds/ai-templates.seed.ts"
    echo "4. Start the server: npm run dev"
    echo "5. Test endpoint: POST /evidence/:id/auto-map"
    exit 0
else
    echo -e "${RED}❌ Some checks failed ($CHECKS_PASSED/$CHECKS_TOTAL passed)${NC}"
    echo ""
    echo "Please review the errors above."
    exit 1
fi
