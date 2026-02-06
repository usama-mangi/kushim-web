#!/bin/bash

# Dashboard Status Verification Script
# Checks current compliance state and what needs to be fixed

echo "================================================"
echo "  Kushim Dashboard - Compliance Status Check"
echo "================================================"
echo ""

# Check if Docker containers are running
echo "1. Checking infrastructure..."
REDIS_STATUS=$(docker ps | grep kushim-redis | wc -l)
POSTGRES_STATUS=$(docker ps | grep kushim-postgres | wc -l)

if [ "$REDIS_STATUS" -eq 1 ] && [ "$POSTGRES_STATUS" -eq 1 ]; then
  echo "   ✅ PostgreSQL and Redis are running"
else
  echo "   ❌ Required containers not running"
  echo "      Run: docker-compose up postgres redis -d"
  exit 1
fi

echo ""
echo "2. Checking database state..."

# Check compliance checks
echo ""
echo "   Compliance Checks by Status:"
echo "   =============================="
docker exec -it kushim-postgres psql -U postgres -d kushim -t -c "
  SELECT 
    status::text as status,
    COUNT(*)::text as count
  FROM compliance_checks 
  GROUP BY status
  ORDER BY 
    CASE status 
      WHEN 'PASS' THEN 1 
      WHEN 'WARNING' THEN 2 
      WHEN 'FAIL' THEN 3 
      ELSE 4 
    END;
" 2>/dev/null | sed 's/^/   /'

# Check evidence
EVIDENCE_COUNT=$(docker exec -it kushim-postgres psql -U postgres -d kushim -t -c "SELECT COUNT(*) FROM evidence;" 2>/dev/null | tr -d '[:space:]')
echo ""
echo "   Evidence Records: $EVIDENCE_COUNT"

# Check integrations
echo ""
echo "   Active Integrations:"
echo "   ===================="
docker exec -it kushim-postgres psql -U postgres -d kushim -t -c "
  SELECT type::text || ' - ' || status::text 
  FROM integrations;
" 2>/dev/null | sed 's/^/   /'

echo ""
echo "3. Detailed Control Status:"
echo "   =========================="
docker exec -it kushim-postgres psql -U postgres -d kushim -t -c "
  SELECT 
    ctrl.control_id,
    LEFT(ctrl.title, 35),
    c.status::text
  FROM compliance_checks c
  JOIN controls ctrl ON c.control_id = ctrl.id
  ORDER BY c.status DESC, ctrl.control_id;
" 2>/dev/null | awk '{printf "   %-12s %-37s %s\n", $1, $2, $3}'

echo ""
echo "4. Compliance Score Calculation:"
echo "   =============================="

TOTAL=$(docker exec -it kushim-postgres psql -U postgres -d kushim -t -c "SELECT COUNT(*) FROM compliance_checks;" 2>/dev/null | tr -d '[:space:]')
PASSING=$(docker exec -it kushim-postgres psql -U postgres -d kushim -t -c "SELECT COUNT(*) FROM compliance_checks WHERE status = 'PASS';" 2>/dev/null | tr -d '[:space:]')
FAILING=$(docker exec -it kushim-postgres psql -U postgres -d kushim -t -c "SELECT COUNT(*) FROM compliance_checks WHERE status = 'FAIL';" 2>/dev/null | tr -d '[:space:]')
WARNING=$(docker exec -it kushim-postgres psql -U postgres -d kushim -t -c "SELECT COUNT(*) FROM compliance_checks WHERE status = 'WARNING';" 2>/dev/null | tr -d '[:space:]')

if [ "$TOTAL" -gt 0 ]; then
  SCORE=$((PASSING * 100 / TOTAL))
else
  SCORE=0
fi

echo "   Passing:  $PASSING / $TOTAL = $SCORE%"
echo "   Warning:  $WARNING"
echo "   Failing:  $FAILING"

echo ""
echo "5. What Needs to Be Fixed:"
echo "   ========================"

if [ "$FAILING" -gt 0 ]; then
  echo "   🔴 CRITICAL: $FAILING controls failing"
  echo ""
  echo "   Failed Controls:"
  docker exec -it kushim-postgres psql -U postgres -d kushim -t -c "
    SELECT '   - ' || ctrl.control_id || ': ' || ctrl.title
    FROM compliance_checks c
    JOIN controls ctrl ON c.control_id = ctrl.id
    WHERE c.status = 'FAIL'
    ORDER BY ctrl.control_id;
  " 2>/dev/null
  echo ""
  echo "   📖 Fix: Follow docs/GITHUB_SECURITY_SETUP.md"
  echo "       Step 1: Enable branch protection"
fi

if [ "$WARNING" -gt 0 ]; then
  echo ""
  echo "   ⚠️  WARNING: $WARNING controls need attention"
  echo ""
  echo "   Warning Controls:"
  docker exec -it kushim-postgres psql -U postgres -d kushim -t -c "
    SELECT '   - ' || ctrl.control_id || ': ' || ctrl.title
    FROM compliance_checks c
    JOIN controls ctrl ON c.control_id = ctrl.id
    WHERE c.status = 'WARNING'
    ORDER BY ctrl.control_id;
  " 2>/dev/null
  echo ""
  echo "   📖 Fix: Follow docs/GITHUB_SECURITY_SETUP.md"
  echo "       Step 2-3: Enable security features and commit signing"
fi

if [ "$PASSING" -eq "$TOTAL" ] && [ "$TOTAL" -gt 0 ]; then
  echo "   ✅ All $PASSING controls passing!"
fi

if [ "$TOTAL" -eq 0 ]; then
  echo "   ℹ️  No compliance checks run yet"
  echo "   👉 Click 'Run Compliance Scan' in the dashboard"
fi

echo ""
echo "6. Next Steps:"
echo "   ============"
echo "   1. Open http://localhost:3000/dashboard"
echo "   2. View the compliance guidance alerts"
echo "   3. Follow docs/GITHUB_SECURITY_SETUP.md to fix controls"
echo "   4. Re-run compliance scan"
echo "   5. Verify score improves"
echo ""
echo "================================================"
