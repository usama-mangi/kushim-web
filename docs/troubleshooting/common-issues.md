# Troubleshooting Common Issues

This guide covers solutions to common issues you may encounter while using Kushim.

---

## Table of Contents

- [Integration Connection Failures](#integration-connection-failures)
- [OAuth Callback Errors](#oauth-callback-errors)
- [Rate Limiting Issues](#rate-limiting-issues)
- [Evidence Collection Errors](#evidence-collection-errors)
- [Compliance Check Failures](#compliance-check-failures)
- [Performance Issues](#performance-issues)
- [Database Connection Issues](#database-connection-issues)
- [Docker and Deployment Issues](#docker-and-deployment-issues)
- [UI and Frontend Issues](#ui-and-frontend-issues)

---

## Integration Connection Failures

### AWS Integration Failed

#### Symptom: "Access Denied" Error

```
❌ AWS Connection Failed
Error: AccessDenied: User is not authorized to perform: iam:ListUsers
```

**Root Causes**:
1. IAM policy not attached to user
2. Incorrect access keys
3. Missing required permissions

**Solutions**:

**1. Verify IAM Policy is Attached**
```bash
# Check which policies are attached to user
aws iam list-attached-user-policies --user-name kushim-integration

# Expected output should include:
# - PolicyName: KushimComplianceReadOnly
```

**2. Test Access Keys Manually**
```bash
# Export credentials
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="us-east-1"

# Test IAM access
aws iam list-users --max-items 1

# Test S3 access
aws s3api list-buckets

# Test CloudTrail access
aws cloudtrail describe-trails
```

**3. Regenerate Access Keys**
1. AWS Console → IAM → Users → kushim-integration
2. Security credentials tab
3. Delete old access keys
4. Create new access key
5. Update `.env` file
6. Restart backend: `docker-compose restart backend`

**4. Verify Policy Permissions**

Ensure IAM policy includes:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iam:ListUsers",
        "iam:ListMFADevices",
        "s3:ListAllMyBuckets",
        "s3:GetBucketEncryption",
        "cloudtrail:LookupEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

---

#### Symptom: "Invalid Region" Error

```
❌ AWS Connection Failed
Error: InvalidClientTokenId: The security token included in the request is invalid
```

**Solutions**:

1. **Check Region Matches**:
```env
# In .env file
AWS_REGION="us-east-1"  # Must match where your resources are
```

2. **Common Regions**:
```
US East:      us-east-1, us-east-2
US West:      us-west-1, us-west-2
EU:           eu-west-1, eu-central-1
Asia Pacific: ap-southeast-1, ap-northeast-1
```

3. **Test Region Access**:
```bash
aws ec2 describe-regions --region us-east-1
```

---

### GitHub Integration Failed

#### Symptom: "Bad Credentials" or "401 Unauthorized"

```
❌ GitHub Connection Failed
Error: Bad credentials
```

**Solutions**:

**1. Verify Token Format**
```bash
# Personal Access Token should start with:
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Classic token
github_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Fine-grained token

# NOT:
gho_  # OAuth token (use OAuth flow instead)
ghs_  # GitHub App token
```

**2. Check Token Scopes**
```bash
# Test token and check scopes
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/user \
  -I | grep -i scope

# Should include: repo, read:org
```

**3. Verify Token Not Expired**
- GitHub → Settings → Developer settings → Personal access tokens
- Check expiration date
- Regenerate if expired

**4. Test Token Manually**
```bash
# Test authentication
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/user

# Expected: Your user info (JSON)
# If 401: Token invalid
```

---

#### Symptom: "Resource Not Accessible" for Organization Repos

```
❌ GitHub Connection Test Passed
⚠️  Warning: 0 repositories accessible
```

**Solutions**:

**1. For Personal Access Tokens**:
- Ensure `read:org` scope is enabled
- Re-create token with org access:
  ```
  Scopes:
    ✅ repo (full control)
    ✅ read:org (read org membership)
  ```

**2. For OAuth Apps**:
- After OAuth authorization, grant organization access:
  ```
  GitHub → Settings → Applications → Authorized OAuth Apps
  → Kushim Compliance Platform → Grant organization access
  ```

**3. Check Organization Settings**:
- Org Settings → Third-party access → OAuth application policy
- Ensure Kushim is not blocked

---

### Okta Integration Failed

#### Symptom: "Organization Not Found"

```
❌ Okta Connection Failed
Error: Organization not found: your-domain.okta.com
```

**Solutions**:

**1. Verify Domain Format**
```env
# Correct formats:
OKTA_DOMAIN="your-domain.okta.com"          # Production
OKTA_DOMAIN="your-domain.oktapreview.com"   # Preview
OKTA_DOMAIN="your-domain.okta-emea.com"     # EMEA region
OKTA_DOMAIN="your-domain.okta-gov.com"      # GovCloud

# WRONG (don't include https://):
OKTA_DOMAIN="https://your-domain.okta.com"  # ❌
```

**2. Test Domain Access**
```bash
# Test if domain is reachable
curl -I https://your-domain.okta.com

# Expected: HTTP 200 or 302
# If error: Domain may be wrong or Okta org suspended
```

**3. Verify in Browser**
- Navigate to `https://your-domain.okta.com`
- Should show Okta login page
- If 404: Domain incorrect

---

#### Symptom: "Invalid API Token"

```
❌ Okta Connection Failed
Error: Invalid token provided
```

**Solutions**:

**1. Verify Token Format**
```bash
# Okta API tokens start with:
00abc123def456...  # Should be ~42 characters

# NOT:
SSWS ...  # Old format (still works but deprecated)
```

**2. Check Token Hasn't Been Revoked**
- Okta Admin → Security → API → Tokens
- Verify token still exists and is active
- Regenerate if needed

**3. Verify Admin Permissions**
```
Token created by user needs:
  ✅ Read-only Admin role (minimum)
  Or
  ✅ Super Admin role
```

**4. Test Token Manually**
```bash
curl -X GET "https://your-domain.okta.com/api/v1/users?limit=1" \
  -H "Authorization: SSWS YOUR_TOKEN"

# Expected: User list (JSON)
# If 401: Token invalid
```

---

### Jira Integration Failed

#### Symptom: "Authentication Failed"

```
❌ Jira Connection Failed
Error: 401 Unauthorized
```

**Solutions**:

**1. Verify Email/Token Pair**
```bash
# Email must match the account that created the token
# Test manually:
curl -u "YOUR_EMAIL:YOUR_API_TOKEN" \
  https://your-domain.atlassian.net/rest/api/3/myself

# Expected: Your user info
# If 401: Email or token incorrect
```

**2. Check API Token Format (Jira Cloud)**
```bash
# Jira Cloud API tokens start with:
ATATT3xFfGF0...  # ~200+ characters

# NOT your Jira password!
```

**3. Regenerate Token**
- [Atlassian Account](https://id.atlassian.com/manage-profile/security/api-tokens)
- Revoke old token
- Create new token
- Update `.env`

**4. Verify Domain Format**
```env
# Correct:
JIRA_DOMAIN="your-domain.atlassian.net"

# WRONG:
JIRA_DOMAIN="https://your-domain.atlassian.net"  # ❌ No https://
JIRA_DOMAIN="your-domain.atlassian.net/jira"    # ❌ No /jira
```

---

#### Symptom: "Project Does Not Exist"

```
❌ Jira Ticket Creation Failed
Error: Project 'COMP' does not exist or you do not have permission to create issues
```

**Solutions**:

**1. Verify Project Key**
```bash
# Project key is uppercase, usually 2-10 chars
# Find it: Jira → Project Settings → Details → Key

# Correct: COMP, SEC, IT
# Wrong: comp, Compliance, compliance-management
```

**2. Check Permissions**
```bash
# Test project access:
curl -u "EMAIL:TOKEN" \
  https://your-domain.atlassian.net/rest/api/3/project/COMP

# Expected: Project details
# If 404: Project doesn't exist or no access
```

**3. Verify User Can Create Issues**
- Jira → Project Settings → Permissions
- Check user has "Create Issues" permission

---

### Slack Integration Failed

#### Symptom: "Invalid Webhook URL"

```
❌ Slack Connection Failed
Error: Invalid webhook URL
```

**Solutions**:

**1. Verify Webhook URL Format**
```env
# Correct format:
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX"

# WRONG:
SLACK_WEBHOOK_URL="hooks.slack.com/..."        # ❌ Missing https://
SLACK_WEBHOOK_URL="https://slack.com/..."      # ❌ Wrong domain
```

**2. Test Webhook Manually**
```bash
curl -X POST "$SLACK_WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test message from Kushim"}'

# Expected: "ok"
# If error: Webhook may be revoked or invalid
```

**3. Regenerate Webhook**
- Slack → Apps → Manage → Kushim Compliance Alerts
- Incoming Webhooks → Revoke old webhook
- Add new webhook to workspace
- Update `.env`

---

## OAuth Callback Errors

### Symptom: "Redirect URI Mismatch"

```
❌ OAuth Error
Error: redirect_uri_mismatch
Description: The redirect_uri in the request does not match the registered callback
```

**Common Causes**:
- Callback URL mismatch between OAuth app and backend config
- HTTP vs HTTPS mismatch
- Trailing slash discrepancy
- Port number missing or incorrect

**Solutions**:

**1. Verify Exact Match**

OAuth App Configuration:
```
GitHub App Callback: http://localhost:3001/api/integrations/github/callback
```

Backend `.env`:
```env
GITHUB_CALLBACK_URL="http://localhost:3001/api/integrations/github/callback"
```

⚠️ Must match EXACTLY:
- Protocol: `http://` vs `https://`
- Port: `:3001`
- Path: `/api/integrations/github/callback`
- No trailing slash

**2. Check for Common Mistakes**

```env
# WRONG:
GITHUB_CALLBACK_URL="http://localhost:3001/api/integrations/github/callback/"  # ❌ Trailing slash
GITHUB_CALLBACK_URL="https://localhost:3001/..."  # ❌ HTTPS on localhost
GITHUB_CALLBACK_URL="http://localhost/..."        # ❌ Missing port

# CORRECT:
GITHUB_CALLBACK_URL="http://localhost:3001/api/integrations/github/callback"
```

**3. Update OAuth App**

For each integration:

**GitHub**:
- Settings → Developer settings → OAuth Apps → Kushim
- Update "Authorization callback URL"

**Okta**:
- Admin Console → Applications → Kushim → General Settings
- Update "Sign-in redirect URIs"

**Jira** (Atlassian OAuth):
- App settings → Manage apps → OAuth credentials
- Update "Callback URL"

**4. Restart Backend After Changes**
```bash
docker-compose restart backend
```

---

### Symptom: "State Parameter Mismatch"

```
❌ OAuth Error
Error: Invalid state parameter
```

**Solutions**:

**1. Clear Browser Cookies**
- OAuth state stored in session
- Clear site cookies and retry

**2. Check Session Storage**
```bash
# Verify Redis is running (stores OAuth state)
docker-compose ps redis

# Expected: redis running
# If not: docker-compose up -d redis
```

**3. Increase State Timeout**
```typescript
// apps/backend/src/integrations/oauth/oauth.service.ts
const STATE_TIMEOUT = 600; // 10 minutes (increase if needed)
```

---

## Rate Limiting Issues

### AWS Rate Limiting

**Symptom**:
```
❌ AWS Evidence Collection Failed
Error: Throttling: Rate exceeded
```

**Solutions**:

**1. Reduce Check Frequency**
```
Settings → Compliance Checks → Schedule
Change from: Every 6 hours
To: Daily at 2 AM
```

**2. Implement Exponential Backoff** (already implemented)
```typescript
// apps/backend/src/common/utils/retry.util.ts
// Retries with backoff: 1s, 2s, 4s, 8s, 16s
```

**3. AWS Service Limits**:
```
IAM ListUsers: 5,000 requests/hour (sufficient)
S3 ListBuckets: No limit
CloudTrail LookupEvents: 2 requests/second

If exceeded:
- Contact AWS Support to increase limits
- Spread checks across longer time window
```

---

### GitHub Rate Limiting

**Symptom**:
```
❌ GitHub Compliance Check Failed
Error: API rate limit exceeded for user ID 12345
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200
```

**Solutions**:

**1. Check Rate Limit Status**
```bash
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/rate_limit

# Output:
{
  "resources": {
    "core": {
      "limit": 5000,
      "remaining": 0,
      "reset": 1640995200  # Unix timestamp
    }
  }
}
```

**2. Calculate Reset Time**
```bash
# Convert reset timestamp to readable time
date -d @1640995200

# Wait until this time or:
```

**3. Reduce API Calls**
- Reduce check frequency
- Monitor fewer repositories
- Use conditional requests (Kushim does this automatically):
  ```
  If-None-Match: "etag-value"
  ```

**4. GitHub Rate Limits**:
```
Authenticated: 5,000 requests/hour (should be enough)
Unauthenticated: 60 requests/hour (ensure token is used!)

Secondary Rate Limits:
- Max 100 concurrent requests
- No more than 900 points per minute for search API
```

---

### Okta Rate Limiting

**Symptom**:
```
❌ Okta MFA Check Failed
Error: 429 Too Many Requests
X-Rate-Limit-Remaining: 0
```

**Solutions**:

**1. Check Okta Rate Limits by License**:
```
Developer (free): 1,000 requests/minute
Production (paid):
  - Starter: 5,000/minute
  - Enterprise: 10,000/minute
```

**2. Reduce Check Frequency**:
```
For orgs with 1000+ users:
  Change from: Every 6 hours
  To: Daily
```

**3. Contact Okta Support**:
- Request rate limit increase
- Typically granted for compliance use cases

**4. Implement Caching** (already implemented):
```typescript
// Kushim caches Okta responses for 1 hour
// Reduces duplicate API calls
```

---

### Jira Rate Limiting

**Symptom**:
```
❌ Jira Ticket Creation Failed
Error: Rate limit exceeded
X-RateLimit-Limit: 10000
```

**Solutions**:

**1. Jira Cloud Rate Limits**:
```
Standard: 10,000 requests/hour
Premium: 25,000 requests/hour
```

**2. Enable Ticket Deduplication**:
```
Settings → Integrations → Jira
☑ Check for existing tickets before creating
```

**3. Batch Ticket Creation**:
```
Instead of: Create 10 tickets immediately
Do: Create 10 tickets over 10 minutes
```

---

## Evidence Collection Errors

### Symptom: Evidence Not Saved to S3

```
⚠️  Warning: Evidence collection succeeded but S3 upload failed
Error: NoSuchBucket: The specified bucket does not exist
```

**Solutions**:

**1. Verify S3 Bucket Exists**
```bash
aws s3 ls s3://kushim-evidence-storage-acme-corp

# If error: Bucket doesn't exist
# Create it:
aws s3 mb s3://kushim-evidence-storage-acme-corp --region us-east-1
```

**2. Check Bucket Name in Config**
```env
# Must match actual bucket name exactly
AWS_S3_BUCKET_NAME="kushim-evidence-storage-acme-corp"
```

**3. Verify S3 Permissions**
```json
{
  "Effect": "Allow",
  "Action": [
    "s3:PutObject",
    "s3:GetObject"
  ],
  "Resource": "arn:aws:s3:::kushim-evidence-storage-*/*"
}
```

---

### Symptom: Evidence Collection Timeout

```
❌ Evidence Collection Failed
Error: Timeout after 120 seconds
```

**Solutions**:

**1. Increase Timeout**
```env
# In .env
EVIDENCE_COLLECTION_TIMEOUT=300  # 5 minutes (default: 120)
```

**2. Reduce Scope**
```
Instead of: Check all 100 repositories
Do: Check 10 repositories at a time
```

**3. Check Network Connectivity**
```bash
# Test connectivity to AWS
ping s3.amazonaws.com

# Test connectivity to GitHub
ping api.github.com

# Test connectivity to Okta
ping your-domain.okta.com
```

---

## Compliance Check Failures

### Symptom: Check Completes but All Controls Show "Unknown"

```
✅ Compliance Check Complete
⚠️  All controls status: UNKNOWN
```

**Causes**:
1. Integration not connected
2. Integration credentials expired
3. No data returned from integration

**Solutions**:

**1. Verify Integration Health**
```
Dashboard → Integration Health

Expected:
  ✅ AWS: Connected (last sync: 5m ago)

If showing:
  ❌ AWS: Disconnected
  
Then: Reconnect integration
```

**2. Test Integration Manually**
```bash
# Test AWS from backend container
docker-compose exec backend sh
node -e "
  const { IAMClient, ListUsersCommand } = require('@aws-sdk/client-iam');
  const client = new IAMClient({ region: 'us-east-1' });
  client.send(new ListUsersCommand({})).then(console.log).catch(console.error);
"
```

**3. Check Backend Logs**
```bash
docker-compose logs backend -f --tail=100

# Look for errors like:
# "AWS integration failed: InvalidClientTokenId"
# "GitHub integration failed: Bad credentials"
```

---

### Symptom: Some Controls Pass, Others Fail Unexpectedly

```
✅ AWS_IAM_MFA: PASS (expected)
❌ AWS_S3_ENCRYPTION: FAIL (unexpected - all buckets are encrypted!)
```

**Solutions**:

**1. Review Evidence**
```
Controls → AWS_S3_ENCRYPTION → View Evidence

Check:
  - Which buckets were scanned?
  - Are all buckets included?
  - Is encryption status accurate?
```

**2. Check Control Thresholds**
```
Settings → Controls → AWS_S3_ENCRYPTION

Threshold: [95 %]  # If 94% encrypted → FAIL

Adjust if needed based on your requirements
```

**3. Re-run Single Control**
```
Controls → AWS_S3_ENCRYPTION → Re-run Check

Sometimes transient issues cause failures
```

---

## Performance Issues

### Symptom: Compliance Checks Take >5 Minutes

**Expected Duration**:
```
Small org (1-5 repos, <100 users): ~30 seconds
Medium org (10-50 repos, 100-500 users): ~2 minutes
Large org (100+ repos, 1000+ users): ~10 minutes
```

**Solutions**:

**1. Check Database Performance**
```bash
# Check PostgreSQL slow queries
docker-compose logs postgres | grep "duration"

# If many slow queries:
docker-compose exec postgres psql -U postgres -d kushim -c "
  SELECT query, calls, total_time, mean_time
  FROM pg_stat_statements
  ORDER BY mean_time DESC
  LIMIT 10;
"
```

**2. Optimize Database**
```bash
# Run VACUUM ANALYZE
docker-compose exec postgres psql -U postgres -d kushim -c "VACUUM ANALYZE;"

# Rebuild indexes
docker-compose exec postgres psql -U postgres -d kushim -c "REINDEX DATABASE kushim;"
```

**3. Check Redis Performance**
```bash
# Check Redis connection
docker-compose exec redis redis-cli ping
# Expected: PONG

# Check memory usage
docker-compose exec redis redis-cli info memory
```

**4. Increase BullMQ Concurrency**
```typescript
// apps/backend/src/compliance/compliance.module.ts
settings: {
  concurrency: 5,  // Increase from 1 to 5
}
```

**5. Scale Backend**
```bash
# Run multiple backend instances
docker-compose up -d --scale backend=3
```

---

### Symptom: Dashboard Loads Slowly

**Solutions**:

**1. Enable Dashboard Caching**
```typescript
// apps/web/app/dashboard/page.tsx
export const revalidate = 60; // Cache for 60 seconds
```

**2. Reduce Dashboard Data**
```
Dashboard Settings → Display Options
  Controls shown: [25 ▼] (reduce from 100)
  Evidence history: [30 days ▼] (reduce from 90)
```

**3. Clear Browser Cache**
```
Ctrl+Shift+Delete → Clear cached images and files
```

---

## Database Connection Issues

### Symptom: "Connection to Database Failed"

```
❌ Backend Startup Failed
Error: Connection refused (ECONNREFUSED 127.0.0.1:5432)
```

**Solutions**:

**1. Verify PostgreSQL is Running**
```bash
docker-compose ps postgres

# Expected: postgres running
# If not:
docker-compose up -d postgres

# Check logs:
docker-compose logs postgres --tail=50
```

**2. Verify Database URL**
```env
# In apps/backend/.env
DATABASE_URL="postgresql://postgres:password@localhost:5432/kushim?schema=public"

# Format:
# postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA

# For Docker:
DATABASE_URL="postgresql://postgres:password@postgres:5432/kushim?schema=public"
# (use service name 'postgres', not 'localhost')
```

**3. Test Connection**
```bash
# From host
psql "postgresql://postgres:password@localhost:5432/kushim"

# From backend container
docker-compose exec backend sh
npx prisma db pull
```

**4. Reset Database**
```bash
# CAUTION: This deletes all data!
docker-compose down postgres
docker volume rm kushim-web_postgres_data
docker-compose up -d postgres

# Recreate schema
cd apps/backend
npm run migrate
npm run seed
```

---

### Symptom: "Too Many Connections" Error

```
❌ Database Error
Error: sorry, too many clients already
```

**Solutions**:

**1. Check Current Connections**
```sql
-- Connect to database
docker-compose exec postgres psql -U postgres -d kushim

-- Check connections
SELECT count(*) FROM pg_stat_activity;
SELECT * FROM pg_stat_activity WHERE datname = 'kushim';
```

**2. Increase Max Connections**
```yaml
# docker-compose.yml
services:
  postgres:
    command: postgres -c max_connections=200  # Default: 100
```

**3. Reduce Prisma Connection Pool**
```env
# In DATABASE_URL
DATABASE_URL="postgresql://postgres:password@postgres:5432/kushim?schema=public&connection_limit=20"
```

---

## Docker and Deployment Issues

### Symptom: "docker-compose up" Fails

```
ERROR: Service 'backend' failed to build
```

**Solutions**:

**1. Check Docker Daemon Running**
```bash
docker ps

# If error: Start Docker Desktop or service
sudo systemctl start docker
```

**2. Clean Docker Build Cache**
```bash
docker-compose down
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

**3. Check Disk Space**
```bash
df -h

# If low on space:
docker system prune -a --volumes  # WARNING: Removes all unused data
```

**4. Check .env Files Exist**
```bash
# Root .env (for Docker Compose)
ls -la .env

# Backend .env
ls -la apps/backend/.env

# Frontend .env
ls -la apps/web/.env.local

# If missing, copy from examples
cp .env.example .env
```

---

### Symptom: Backend Container Crashes on Startup

```
backend_1    | Error: Cannot find module '@nestjs/core'
backend_1 exited with code 1
```

**Solutions**:

**1. Rebuild with Dependencies**
```bash
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

**2. Check node_modules Mounted**
```yaml
# docker-compose.yml - ensure this is commented out:
# volumes:
#   - ./apps/backend:/app  # ❌ Can overwrite node_modules

# Or use named volume:
volumes:
  - ./apps/backend/src:/app/src
  - backend_node_modules:/app/node_modules

volumes:
  backend_node_modules:
```

**3. Install Dependencies in Container**
```bash
docker-compose exec backend npm install
docker-compose restart backend
```

---

## UI and Frontend Issues

### Symptom: "Internal Server Error" When Loading Page

```
500 Internal Server Error
Application error: a client-side exception has occurred
```

**Solutions**:

**1. Check Frontend Logs**
```bash
docker-compose logs web -f --tail=100

# Look for:
# - API connection errors
# - Missing environment variables
# - Build errors
```

**2. Verify Backend Connection**
```env
# In apps/web/.env.local
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Must be accessible from browser
# Test in browser: http://localhost:3001/api/health
```

**3. Clear Next.js Cache**
```bash
docker-compose exec web rm -rf .next
docker-compose restart web
```

**4. Rebuild Frontend**
```bash
docker-compose down web
docker-compose build --no-cache web
docker-compose up -d web
```

---

### Symptom: "Failed to Fetch" or CORS Errors

```
❌ Network Error
Access to fetch at 'http://localhost:3001/api/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solutions**:

**1. Verify CORS Configuration**
```env
# In apps/backend/.env
FRONTEND_URL="http://localhost:3000"

# Must match frontend URL exactly
```

**2. Check CORS Middleware**
```typescript
// apps/backend/src/main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});
```

**3. Use Proxy (Alternative)**
```javascript
// apps/web/next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};
```

---

## Getting Additional Help

### Enable Debug Logging

**Backend**:
```env
# In apps/backend/.env
LOG_LEVEL="debug"  # Default: "info"
NODE_ENV="development"
```

**View Logs**:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs backend -f --tail=100

# Save logs to file
docker-compose logs > logs.txt
```

### Check System Health

```bash
# API health endpoint
curl http://localhost:3001/api/health

# Expected:
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "integrations": {
    "aws": "connected",
    "github": "connected",
    ...
  }
}
```

### Generate Support Bundle

```bash
# Create support bundle with logs and config
./scripts/create-support-bundle.sh

# Sends:
# - Docker logs (last 1000 lines)
# - Environment variables (redacted)
# - Database status
# - Integration health

# Upload to support@kushim.io
```

---

## Common Error Codes Reference

| Error Code | Meaning | Common Fix |
|------------|---------|------------|
| 401 | Unauthorized | Check API token/credentials |
| 403 | Forbidden | Check permissions/scopes |
| 404 | Not Found | Verify resource exists (domain, project, etc) |
| 429 | Rate Limited | Reduce frequency, wait for reset |
| 500 | Server Error | Check backend logs, restart service |
| 502 | Bad Gateway | Backend down, restart container |
| 503 | Service Unavailable | Service starting, wait 30s |
| ECONNREFUSED | Connection Refused | Service not running, start it |
| ETIMEDOUT | Timeout | Network issue or slow response |

---

## Still Having Issues?

If you've tried the solutions above and still experiencing problems:

### 1. Search Documentation
- 📚 [Integration Setup Guides](../setup/)
- 📖 [Getting Started Guide](../guides/getting-started.md)
- 💡 [FAQ](../faq.md)

### 2. Contact Support

**Email**: support@kushim.io
- Include:
  - Error message (full text)
  - Steps to reproduce
  - Environment (Docker, manual, cloud)
  - Relevant logs
  - What you've already tried

**Slack Community**: [kushim-community.slack.com](https://kushim-community.slack.com)
- #troubleshooting channel
- Community support (response: <2h during business hours)

**GitHub Issues**: [github.com/kushim/kushim/issues](https://github.com/kushim/kushim/issues)
- For bugs and feature requests
- Include reproduction steps

### 3. Enterprise Support

For customers with Enterprise plan:
- 📞 **Phone**: +1 (555) 123-4567
- 💬 **Dedicated Slack channel**
- 🎫 **Priority support tickets**
- ⏱️ **SLA**: <4h response time
