# Okta Integration Setup Guide

## Overview

The Okta integration enables Kushim to automatically verify SOC 2 compliance controls related to:
- **MFA Enforcement** (CC6.1 - Logical Access Controls)
- **User Access Management** (CC6.2 - Access Review)
- **Password Policy Compliance** (CC6.1 - Authentication)
- **Session Management** (CC6.3 - Session Controls)

This guide covers API token and OAuth setup for Okta integration.

---

## Prerequisites

- Okta account (trial, developer, or production)
- Super Admin or Org Admin role in Okta
- Okta domain URL (e.g., `your-domain.okta.com`)
- Kushim backend running and accessible

---

## Method 1: API Token (Recommended for Quick Start)

### Step 1: Create Okta API Token

#### 1.1 Navigate to API Tokens

1. Sign in to your [Okta Admin Console](https://your-domain.okta.com/admin)
2. Go to **Security** → **API** (in left sidebar)
3. Click **Tokens** tab
4. Click **Create Token** button

#### 1.2 Configure Token

**Token name**: Enter a descriptive name

```
Token name: Kushim Compliance Platform
Description: Read-only access for SOC 2 compliance automation
```

#### 1.3 Save Token

1. Click **Create Token**
2. **Copy the token immediately** (e.g., `00abc123def456ghi789jkl0mnop_qrstuvwxyz`)
3. Store in password manager - you won't see it again!
4. Click **OK, got it**

⚠️ **IMPORTANT**: API tokens inherit the permissions of the admin who created them. Create tokens using an admin account with appropriate read permissions.

### Step 2: Configure Kushim Backend

#### 2.1 Update Environment Variables

```bash
cd apps/backend
nano .env
```

Add the Okta configuration:

```env
# Okta Integration
OKTA_DOMAIN="your-domain.okta.com"
OKTA_API_TOKEN="00abc123def456ghi789jkl0mnop_qrstuvwxyz"
```

**Note**: 
- Use domain only, not full URL (e.g., `acme.okta.com` not `https://acme.okta.com`)
- For Okta Preview: use `your-domain.oktapreview.com`
- For OktaGov: use `your-domain.okta-gov.com`

#### 2.2 Restart Backend

```bash
# Local development
npm run backend:dev

# Docker
docker-compose restart backend
```

### Step 3: Connect in Kushim UI

#### 3.1 Navigate to Integrations

1. Log in to Kushim web interface
2. Go to **Settings** → **Integrations**
3. Find **Okta** card
4. Click **Connect**

#### 3.2 Enter Okta Details

Fill in the connection form:

```
Okta Domain:    [your-domain.okta.com        ]
API Token:      [00abc123def456ghi789jkl...  ]

[Test Connection]  [Cancel]  [Connect]
```

#### 3.3 Verify Connection

Click **Test Connection**. Expected result:

```
✅ Connection Successful
✅ Domain Reachable: your-domain.okta.com
✅ API Token Valid
✅ User Access: Read
✅ MFA Factor Access: Read
✅ Policy Access: Read

Total Users: 147
Active Users: 132
Deactivated Users: 15
```

### Step 4: Run Initial Compliance Check

1. Click **Run Compliance Check**
2. Wait for completion (~30-60 seconds)
3. Review results:

```
MFA Enforcement Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 95.5% users have MFA enabled (126/132)
⚠️  6 users without MFA

Password Policy Compliance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Minimum length: 12 characters
✅ Complexity requirements: Met
✅ Password expiration: 90 days
✅ Password history: 5 passwords

Session Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Idle timeout: 30 minutes
✅ Max session lifetime: 8 hours
```

---

## Method 2: OAuth 2.0 (Recommended for Production)

OAuth provides more granular permissions and better security for team environments.

### Step 1: Create OAuth Application in Okta

#### 1.1 Navigate to Applications

1. In Okta Admin Console, go to **Applications** → **Applications**
2. Click **Create App Integration**
3. Select:
   - **Sign-in method**: `OAuth 2.0`
   - **Application type**: `Web Application`
4. Click **Next**

#### 1.2 Configure Application

Fill in application details:

```
App integration name: Kushim Compliance Platform

Grant type:
☑ Authorization Code
☑ Refresh Token

Sign-in redirect URIs:
  http://localhost:3001/api/integrations/okta/callback  (for local dev)
  https://app.kushim.io/api/integrations/okta/callback  (for production)

Sign-out redirect URIs:
  http://localhost:3000  (optional)

Trusted Origins:
  http://localhost:3000  (for local dev)
  https://app.kushim.io  (for production)

Assignments:
⚫ Skip group assignment for now
```

#### 1.3 Save Application

1. Click **Save**
2. Note down:
   - **Client ID** (e.g., `0oa1b2c3d4e5f6g7h8i9`)
   - **Client Secret** (click **Show** to reveal, e.g., `a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0`)

### Step 2: Grant API Scopes

#### 2.1 Navigate to Okta API Scopes

1. In your application settings, scroll to **Okta API Scopes**
2. Click **Grant** next to these scopes:
   - ✅ `okta.users.read` - Read user information
   - ✅ `okta.factors.read` - Read MFA factors
   - ✅ `okta.policies.read` - Read authentication policies
   - ✅ `okta.groups.read` - Read group memberships (optional)
3. Click **Grant Access**

### Step 3: Configure Kushim Backend for OAuth

#### 3.1 Add OAuth Environment Variables

```bash
cd apps/backend
nano .env
```

```env
# Okta OAuth Configuration
OKTA_DOMAIN="your-domain.okta.com"
OKTA_CLIENT_ID="0oa1b2c3d4e5f6g7h8i9"
OKTA_CLIENT_SECRET="a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0"
OKTA_CALLBACK_URL="http://localhost:3001/api/integrations/okta/callback"
OKTA_ISSUER="https://your-domain.okta.com/oauth2/default"
```

#### 3.2 Restart Backend

```bash
npm run backend:dev
# or
docker-compose restart backend
```

### Step 4: Connect via OAuth Flow

#### 4.1 Initiate OAuth

1. In Kushim UI, go to **Settings** → **Integrations**
2. Find **Okta** card
3. Click **Connect with Okta** button
4. You'll be redirected to Okta sign-in page

#### 4.2 Authorize Application

Sign in with Okta admin credentials:

```
Sign in to your-domain.okta.com

Email:    [admin@your-company.com]
Password: [••••••••••••••••••••]

[Sign In]
```

MFA challenge (if enabled for admin):
```
Verify with Okta Verify

Push notification sent to your device
Approve the sign-in request on your phone

[Enter code manually]
```

#### 4.3 Grant Permissions

Review permission request:

```
Kushim Compliance Platform
wants to access your Okta organization

This application will be able to:
✓ Read user profiles
✓ Read MFA enrollment status
✓ Read authentication policies
✓ Read group memberships

[Allow Access]  [Cancel]
```

Click **Allow Access**

#### 4.4 Complete Connection

After authorization, you'll be redirected back to Kushim:

```
✅ Okta Connected Successfully
Organization: your-domain.okta.com
Connected as: admin@your-company.com
Access: Read-only
Users: 147
```

---

## Understanding Compliance Checks

### 1. MFA Enforcement (CC6.1)

**What it checks**:
- Percentage of active users with MFA enrolled
- Types of MFA factors in use (SMS, Okta Verify, hardware tokens)
- MFA policy enforcement rules

**SOC 2 Requirement**: Multi-factor authentication for all user access

**How to remediate**:

#### Option A: Global MFA Policy
1. Okta Admin → Security → Multifactor
2. Click **Factor Types** tab
3. Enable factors:
   - ✅ Okta Verify
   - ✅ Google Authenticator
   - ⚠️ SMS (less secure, avoid if possible)
4. Click **Factor Enrollment** tab
5. Edit **Okta Sign On Policy**
6. Add rule: Require MFA for all users

#### Option B: Sign-On Policy
1. Security → Authentication Policies
2. Select **Default Policy** (or create new)
3. Add rule with:
   - **Prompt for factor**: Every sign on
   - **Possession factor constraints**: Required
4. Save and activate

#### Enforce Enrollment:
```bash
# Via Okta Admin Console
1. Security → Multifactor → Factor Enrollment
2. Edit policy → Make required
3. Set grace period (e.g., 7 days)
```

### 2. Password Policy Compliance (CC6.1)

**What it checks**:
- Minimum password length (recommended: 12+ characters)
- Complexity requirements (uppercase, lowercase, numbers, symbols)
- Password expiration period (recommended: 90 days)
- Password history (recommended: 5+ previous passwords)
- Account lockout settings

**SOC 2 Requirement**: Strong password standards

**How to configure**:

1. Security → Authentication Policies → Password
2. Edit password policy:

```
Minimum length: 12 characters
Complexity:
  ☑ Lowercase required
  ☑ Uppercase required
  ☑ Number required
  ☑ Symbol required (recommended)

Age:
  Maximum age: 90 days
  Expire warning: 15 days before

History:
  Remember last: 5 passwords

Lockout:
  Attempts before lockout: 5
  Lockout duration: 30 minutes
  Auto-unlock after: 30 minutes
```

### 3. Session Management (CC6.3)

**What it checks**:
- Idle session timeout
- Maximum session lifetime
- Re-authentication requirements

**SOC 2 Requirement**: Automatic session termination

**How to configure**:

1. Security → Authentication Policies
2. Edit sign-on policy
3. Set session settings:

```
Idle timeout: 30 minutes
Maximum session lifetime: 8 hours

Re-authentication:
  ☑ Require re-auth for sensitive operations
  ☑ Step-up authentication for admin access
```

### 4. User Access Review (CC6.2)

**What it checks**:
- Recently deactivated users
- Users without activity (dormant accounts)
- Admin role assignments

**SOC 2 Requirement**: Periodic access reviews

**How to review**:

```bash
# In Kushim dashboard
Reports → Access Review
  - Users inactive for 90+ days: 12 users
  - Users never logged in: 5 users
  - Deactivated last 30 days: 3 users

[Generate Access Review Report]
```

Remediation:
1. Directory → People
2. Filter by status: Active
3. Sort by Last Login
4. Deactivate users inactive >90 days

---

## Troubleshooting

### Connection Failed: Invalid Token

**Symptom**: "401 Unauthorized" or "Invalid API token"

**Solutions**:
1. Verify token is correctly copied (no extra spaces)
2. Check token hasn't been revoked
3. Ensure admin account creating token has sufficient permissions
4. Generate new token and retry

### Domain Not Found

**Symptom**: "Organization not found" or DNS errors

**Solutions**:
1. Verify domain format: `your-domain.okta.com` (not full URL)
2. Check for typos in domain name
3. Confirm Okta org is active (not suspended)
4. For preview orgs: use `.oktapreview.com`

### MFA Data Not Showing

**Symptom**: "Unable to list user factors" or 0% MFA enrollment shown

**Solutions**:
1. Verify API token has `okta.factors.read` permission
2. Check Okta rate limits (not exceeded)
3. Try OAuth method instead of API token
4. Ensure MFA is actually enabled in Okta

### OAuth Callback Error

**Symptom**: "Redirect URI mismatch" during OAuth flow

**Solutions**:
1. Verify callback URL in Okta app exactly matches backend config:
   - Local: `http://localhost:3001/api/integrations/okta/callback`
   - Production: `https://app.kushim.io/api/integrations/okta/callback`
2. No trailing slash
3. Protocol must match (http vs https)
4. Check Trusted Origins include frontend URL

### Rate Limit Exceeded

**Symptom**: "429 Too Many Requests"

**Solutions**:
1. Okta limits vary by license:
   - Developer: 1,000 requests/minute
   - Production: 10,000 requests/minute
2. Reduce compliance check frequency
3. Contact Okta support to increase limits
4. Implement request caching in Kushim (automatic)

```bash
# Check current rate limit
curl -X GET "https://your-domain.okta.com/api/v1/users?limit=1" \
  -H "Authorization: SSWS ${OKTA_API_TOKEN}" \
  -I | grep -i rate

# Expected response headers:
X-Rate-Limit-Limit: 1000
X-Rate-Limit-Remaining: 995
X-Rate-Limit-Reset: 1640000000
```

---

## Security Best Practices

### 1. API Token Security

✅ **DO**:
- Create tokens with dedicated service account (not personal admin)
- Set token description/purpose for audit trail
- Rotate tokens every 90 days
- Revoke unused tokens immediately
- Store tokens in secrets manager (production)

❌ **DON'T**:
- Share tokens across multiple services
- Commit tokens to git repositories
- Use personal admin tokens for automation

### 2. Service Account Setup

Create dedicated Okta admin for API access:

1. Directory → People → Add Person
2. Create user: `kushim-integration@your-company.com`
3. Assign minimal admin role:
   - Security → Administrators → Add Administrator
   - Role: **Read-only Administrator** (custom role)

Custom role permissions:
```
Permissions:
  ✅ View Users
  ✅ View Groups
  ✅ View Authentication Policies
  ✅ View MFA Factors
  ❌ Edit (all)
  ❌ Assign Apps
  ❌ Manage Admins
```

### 3. OAuth Best Practices

✅ **DO**:
- Use Authorization Code flow (not Implicit)
- Enable refresh tokens for long-lived access
- Implement token refresh logic
- Store tokens encrypted at rest

### 4. Audit Logging

Monitor Kushim's Okta API usage:

1. Reports → System Log
2. Filter by:
   - **Client**: Kushim Compliance Platform
   - **Event Type**: User read, Factor read, Policy read
3. Review monthly for anomalies

### 5. Principle of Least Privilege

Only grant necessary scopes:

```
Required:
  ✅ okta.users.read
  ✅ okta.factors.read
  ✅ okta.policies.read

Optional (if needed):
  ⚠️ okta.groups.read (for group-based compliance)

Never grant:
  ❌ okta.users.manage
  ❌ okta.factors.manage
  ❌ okta.apps.manage
```

---

## Advanced Configuration

### Custom MFA Policy

Create custom compliance policy for high-risk users:

```javascript
// apps/backend/src/integrations/okta/policies.ts
const highRiskMfaPolicy = {
  name: 'High Risk User MFA',
  conditions: {
    riskScore: { level: 'HIGH' },
  },
  actions: {
    signon: {
      requireFactor: true,
      factorPromptMode: 'ALWAYS',
      rememberDevice: false,
    },
  },
};
```

### Integration with Okta Workflows

Trigger Kushim compliance checks from Okta Workflows:

1. Okta Workflows → Create Flow
2. Trigger: **Scheduled** (Daily at 2 AM)
3. Action: **API Connector**
   - URL: `https://app.kushim.io/api/integrations/okta/compliance-check`
   - Method: POST
   - Headers: `Authorization: Bearer ${KUSHIM_API_KEY}`

### Multi-Org Support

For multiple Okta organizations:

```env
OKTA_ORGS_JSON='[
  {
    "name": "Production",
    "domain": "acme.okta.com",
    "token": "prod_token_here"
  },
  {
    "name": "Staging",
    "domain": "acme-staging.okta.com",
    "token": "staging_token_here"
  }
]'
```

---

## FAQ

**Q: Can Kushim modify Okta users or settings?**
A: No. Kushim only reads data for compliance verification. It cannot create/modify/delete users or change settings.

**Q: What happens if I deactivate a user in Okta?**
A: Kushim will detect the change on next compliance check and update reports accordingly. Deactivated users are excluded from MFA enforcement calculations.

**Q: Does Kushim store Okta passwords?**
A: Absolutely not. Kushim never has access to user passwords. It only reads metadata like MFA status and last login.

**Q: How often should I run compliance checks?**
A: Daily is recommended. For large orgs (>1000 users), consider weekly to avoid rate limits.

**Q: Can I use Okta preview environment?**
A: Yes! Use `your-domain.oktapreview.com` as the domain.

**Q: What about Auth0?**
A: Auth0 integration coming in Phase 3. Okta acquired Auth0, so similar patterns will apply.

---

## Next Steps

- ✅ Configure [AWS Integration](./aws-integration.md) for infrastructure compliance
- ✅ Set up [Jira Integration](./jira-integration.md) for MFA remediation tickets
- ✅ Enable [Slack Integration](./slack-integration.md) for MFA alerts
- 📖 Review [MFA Best Practices Guide](../guides/mfa-best-practices.md)

---

## Resources

- 📚 [Okta API Documentation](https://developer.okta.com/docs/reference/api/users/)
- 🔐 [Okta OAuth 2.0 Guide](https://developer.okta.com/docs/guides/implement-oauth-for-okta/main/)
- 🔑 [API Token Management](https://developer.okta.com/docs/guides/create-an-api-token/)
- 📊 [Rate Limits Reference](https://developer.okta.com/docs/reference/rate-limits/)
- 🛡️ [MFA Best Practices](https://www.okta.com/blog/2019/05/mfa-best-practices/)

---

## Need Help?

- 📧 Email: support@kushim.io
- 💬 Slack Community: [kushim-community.slack.com](https://kushim-community.slack.com)
- 📚 Documentation: [docs.kushim.io](https://docs.kushim.io)
- 🐛 Report Issues: [GitHub Issues](https://github.com/kushim/kushim/issues)
