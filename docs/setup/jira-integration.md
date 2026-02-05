# Jira Integration Setup Guide

## Overview

The Jira integration is Kushim's **secret weapon** for SOC 2 compliance! It automatically creates remediation tickets when compliance controls fail, ensuring nothing falls through the cracks.

**Key Features**:
- **Automatic Ticket Creation** (CC7.3 - Issue Remediation)
- **Remediation Tracking** (CC9.2 - Risk Management)
- **Audit Trail** (CC7.2 - Monitoring)
- **SLA Compliance** (CC7.4 - Incident Response)

This guide covers both Jira Cloud and Jira Server/Data Center setups.

---

## Prerequisites

- Jira Cloud, Server, or Data Center instance
- Jira admin access (to create API tokens/OAuth apps)
- At least one Jira project for compliance tickets
- Kushim backend running and accessible

---

## Jira Cloud vs Server/Data Center

| Feature | Jira Cloud | Jira Server/Data Center |
|---------|------------|------------------------|
| API Version | REST API v3 | REST API v2 |
| Authentication | API Token, OAuth 2.0 | Personal Access Token, OAuth 1.0a |
| Domain | `your-domain.atlassian.net` | `jira.your-company.com` |
| Setup Complexity | ⭐ Easy | ⭐⭐ Medium |

**How to check which you have**:
- Cloud: URL is `*.atlassian.net`
- Server/Data Center: Self-hosted URL (e.g., `jira.yourcompany.com`)

---

## Method 1: Jira Cloud with API Token (Recommended)

### Step 1: Create Jira API Token

#### 1.1 Navigate to API Tokens

1. Log in to [Atlassian Account](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Or: Jira → Profile → **Manage your account** → **Security** tab
3. Click **Create API token**

#### 1.2 Configure Token

```
Label: Kushim Compliance Platform
Description: Automated SOC 2 compliance ticket creation

[Create]
```

#### 1.3 Save Token

1. Copy the token immediately (e.g., `ATATT3xFfGF0abcdefghijklmnopqrstuvwxyz123456789`)
2. Store in password manager - you won't see it again!
3. Click **Close**

### Step 2: Identify Your Jira Details

#### 2.1 Find Jira Domain

Your Jira Cloud domain: `https://your-domain.atlassian.net`

Example:
- Full URL: `https://acme-corp.atlassian.net/jira/software/projects/COMP`
- Domain to use: `acme-corp.atlassian.net`

#### 2.2 Find Email Address

Use the email address associated with your Atlassian account:
- Jira → Profile → View your profile
- Note the email (e.g., `admin@acme-corp.com`)

#### 2.3 Find Project Key

1. Navigate to your compliance project in Jira
2. Note the project key (e.g., `COMP` in `COMP-123`)
3. Or: Project Settings → Details → **Key**

### Step 3: Configure Kushim Backend

#### 3.1 Update Environment Variables

```bash
cd apps/backend
nano .env
```

Add Jira configuration:

```env
# Jira Integration (Cloud)
JIRA_DOMAIN="acme-corp.atlassian.net"
JIRA_EMAIL="admin@acme-corp.com"
JIRA_API_TOKEN="ATATT3xFfGF0abcdefghijklmnopqrstuvwxyz123456789"
JIRA_DEFAULT_PROJECT_KEY="COMP"  # Optional: default project for tickets
```

**Important**: 
- Use domain only, not full URL (`acme-corp.atlassian.net`, not `https://acme-corp.atlassian.net`)
- Email must match the account that created the API token

#### 3.2 Restart Backend

```bash
# Local development
npm run backend:dev

# Docker
docker-compose restart backend
```

### Step 4: Connect in Kushim UI

#### 4.1 Navigate to Integrations

1. Log in to Kushim web interface
2. Go to **Settings** → **Integrations**
3. Find **Jira** card
4. Click **Connect**

#### 4.2 Enter Jira Credentials

Fill in the connection form:

```
Jira Type:       [Cloud ▼]
Jira Domain:     [acme-corp.atlassian.net]
Email:           [admin@acme-corp.com]
API Token:       [ATATT3xFfGF0...] [Show/Hide]

[Test Connection]  [Cancel]  [Connect]
```

#### 4.3 Verify Connection

Click **Test Connection**. Expected result:

```
✅ Connection Successful
✅ Domain Reachable: acme-corp.atlassian.net
✅ Authentication: Valid
✅ API Access: REST API v3
✅ User: admin@acme-corp.com

Available Projects:
  • COMP - Compliance Management
  • SEC - Security Issues
  • IT - IT Operations
```

### Step 5: Configure Project Settings

#### 5.1 Select Default Project

```
Default project for compliance tickets:
[COMP - Compliance Management ▼]

Issue Type:
[Task ▼]

Priority Mapping:
  Critical violations → [Highest ▼]
  High violations → [High ▼]
  Medium violations → [Medium ▼]
  Low violations → [Low ▼]

[Save Configuration]
```

#### 5.2 Configure Ticket Template

Customize how compliance tickets are created:

```
Summary Template:
[{controlId}] {controlTitle} - Compliance Failure

Description Template:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 Compliance Control Failed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Control ID:* {controlId}
*Control Title:* {controlTitle}
*SOC 2 Framework:* {framework}
*Severity:* {severity}

*Failure Reason:*
{failureReason}

*Evidence ID:* {evidenceId}
*Detected:* {timestamp}

*Required Actions:*
1. Review failure details
2. Implement remediation
3. Re-run compliance check
4. Verify resolution

*Links:*
• [View Evidence](https://app.kushim.io/evidence/{evidenceId})
• [SOC 2 Control Details](https://app.kushim.io/controls/{controlId})

_Auto-created by Kushim Compliance Platform_

Labels:
☑ compliance
☑ soc2
☐ urgent
☐ security

[Save Template]
```

### Step 6: Test Automatic Ticket Creation

#### 6.1 Trigger Test Ticket

1. In Integrations page, click **Test Jira Integration**
2. Or run a compliance check that will fail:
   ```bash
   # Via API
   curl -X POST http://localhost:3001/api/compliance/checks/run \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"controls": ["AWS_IAM_MFA"]}'
   ```

#### 6.2 Verify Ticket Created

Check Jira project:

```
COMP-142 | [AWS_IAM_MFA] IAM MFA Enforcement - Compliance Failure
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type: Task
Status: To Do
Priority: High
Assignee: Unassigned
Labels: compliance, soc2, aws, iam

Description:
🚨 Compliance Control Failed
...
```

---

## Method 2: Jira Server/Data Center

### Step 1: Create Personal Access Token (Jira 8.14+)

#### 1.1 Enable PATs (Admin Task)

If you're a Jira admin:
1. Go to **Administration** → **General configuration** → **Security**
2. Click **Personal access tokens**
3. Enable **Allow users to create personal access tokens**

#### 1.2 Create PAT

1. Click your profile icon → **Personal Access Tokens**
2. Click **Create token**
3. **Token name**: `Kushim Compliance Platform`
4. **Expiry date**: Select expiration (e.g., 1 year)
5. Click **Create**
6. Copy token immediately (e.g., `NjEwMzYxNTMxOTg5OmW0BN...`)

### Step 2: Configure Kushim Backend

```env
# Jira Integration (Server/Data Center)
JIRA_TYPE="server"
JIRA_DOMAIN="jira.acme-corp.com"
JIRA_PAT="NjEwMzYxNTMxOTg5OmW0BN..."
JIRA_DEFAULT_PROJECT_KEY="COMP"
```

**Note**: For older Jira Server versions (<8.14), use Basic Auth with username/password instead.

---

## Method 3: OAuth 2.0 (Advanced)

For enterprise deployments requiring granular permissions.

### Step 1: Create OAuth App in Jira

#### 1.1 Register Application

1. Go to **Apps** → **Manage apps** → **OAuth credentials** (Jira admin)
2. Click **Create credentials**
3. Fill in details:

```
Application name: Kushim Compliance Platform
Type: OAuth 2.0 (3LO)

Authorization URL: https://app.kushim.io/integrations/jira/authorize
Callback URL: https://app.kushim.io/api/integrations/jira/callback

Scopes:
  ✅ read:jira-work
  ✅ write:jira-work
  ✅ read:jira-user
```

#### 1.2 Generate Credentials

1. Click **Create**
2. Note **Client ID** and **Client Secret**
3. Configure in Kushim backend:

```env
JIRA_OAUTH_CLIENT_ID="kushim-compliance-..."
JIRA_OAUTH_CLIENT_SECRET="abc123def456..."
JIRA_OAUTH_CALLBACK_URL="https://app.kushim.io/api/integrations/jira/callback"
```

---

## Understanding Automatic Ticket Creation

### When Tickets Are Created

Kushim automatically creates Jira tickets when:

1. **Compliance Control Fails**
   - Example: AWS IAM user without MFA
   - Example: GitHub branch without protection
   - Example: Okta user without 2FA

2. **Severity Threshold Met**
   - Configurable in Settings → Integrations → Jira
   - Default: Medium severity and above

3. **No Existing Ticket**
   - Kushim checks for duplicate tickets (by control ID)
   - Won't spam your Jira!

### Ticket Lifecycle

```
┌─────────────────────────────────────────┐
│ Compliance Check Runs                   │
│ Control: AWS_IAM_MFA                   │
│ Result: FAIL (6 users without MFA)     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ Kushim Creates Jira Ticket              │
│ COMP-142: [AWS_IAM_MFA] MFA Failure    │
│ Status: To Do                           │
│ Assignee: Auto-assigned to team         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ Team Remediates Issue                   │
│ - Enables MFA for 6 users              │
│ - Updates ticket: In Progress → Done   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ Next Compliance Check                   │
│ Control: AWS_IAM_MFA                   │
│ Result: PASS ✅                         │
│ Action: Comment on COMP-142            │
└─────────────────────────────────────────┘
```

### Ticket Fields

Automatic tickets include:

| Field | Description | Example |
|-------|-------------|---------|
| **Summary** | Control ID + Title | `[AWS_IAM_MFA] IAM MFA Enforcement Failure` |
| **Description** | Detailed failure info | SOC 2 context, remediation steps |
| **Priority** | Based on severity | Highest, High, Medium, Low |
| **Labels** | Auto-tagged | `compliance`, `soc2`, `aws` |
| **Components** | Optional mapping | `Security`, `Infrastructure` |
| **Due Date** | SLA-based | 7 days for High, 30 for Medium |
| **Assignee** | Auto-assignment rules | Team lead, on-call engineer |

---

## Advanced Configuration

### Custom Field Mapping

Map Kushim data to custom Jira fields:

```typescript
// apps/backend/src/integrations/jira/field-mapping.ts
export const customFieldMapping = {
  controlId: 'customfield_10001',        // Text field
  framework: 'customfield_10002',        // Select (SOC 2, ISO 27001, etc.)
  evidenceUrl: 'customfield_10003',      // URL field
  affectedSystems: 'customfield_10004',  // Multi-select
};
```

Configure in UI:
```
Custom Field Mapping:
  Control ID → [customfield_10001 ▼]
  SOC 2 Framework → [customfield_10002 ▼]
  Evidence URL → [customfield_10003 ▼]

[Save Mapping]
```

### Auto-Assignment Rules

Automatically assign tickets based on control type:

```
Assignment Rules:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AWS Controls → Assignee: [cloud-team ▼]
GitHub Controls → Assignee: [dev-team ▼]
Okta Controls → Assignee: [security-team ▼]
Default → Assignee: [compliance-lead ▼]

[Add Rule]  [Save Rules]
```

### SLA Enforcement

Set due dates based on severity:

```
SLA Configuration:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Critical violations → Due: [1 days ▼]
High violations → Due: [7 days ▼]
Medium violations → Due: [30 days ▼]
Low violations → Due: [90 days ▼]

☑ Add calendar days (not business days)
☑ Send Slack alert if SLA approaching

[Save SLA Settings]
```

### Workflow Integration

Trigger actions when ticket status changes:

```javascript
// apps/backend/src/integrations/jira/webhooks.ts
export const webhookHandlers = {
  // When ticket resolved
  'jira:issue_updated': async (event) => {
    if (event.issue.status === 'Done') {
      // Re-run compliance check
      await complianceService.recheck(event.issue.controlId);
    }
  },
  
  // When ticket commented
  'jira:issue_commented': async (event) => {
    // Notify compliance team in Slack
    await slackService.sendAlert({
      title: 'Jira Ticket Update',
      message: `${event.user} commented on ${event.issue.key}`,
    });
  },
};
```

---

## Troubleshooting

### Connection Failed: Authentication Error

**Symptom**: "401 Unauthorized" or "403 Forbidden"

**Solutions**:

1. **Verify credentials**:
```bash
# Test Jira API manually
curl -u "admin@acme.com:YOUR_API_TOKEN" \
  https://acme-corp.atlassian.net/rest/api/3/myself
```

2. **Check email/token match**: Email must be the account that created the token

3. **API token not password**: Don't use your Jira password, use API token

4. **Regenerate token**: Old tokens may be revoked

### Domain Not Found

**Symptom**: "Site not found" or DNS errors

**Solutions**:
1. Verify domain format:
   - Cloud: `your-domain.atlassian.net` (no `https://`)
   - Server: `jira.your-company.com` (your actual domain)
2. Test domain in browser first
3. Check for typos

### Project Key Invalid

**Symptom**: "Project does not exist" when creating ticket

**Solutions**:
1. Verify project key is uppercase (e.g., `COMP` not `comp`)
2. Check you have access to project:
   ```bash
   curl -u "email:token" \
     https://your-domain.atlassian.net/rest/api/3/project/COMP
   ```
3. Ensure project is not archived

### Ticket Creation Failed: Field Required

**Symptom**: "Field 'X' is required" error

**Solutions**:
1. **Check required fields** in project:
   - Jira → Project Settings → Issue types → Task
   - Note all required fields
2. **Map fields in Kushim**:
   - Settings → Integrations → Jira → Field Mapping
   - Ensure all required fields are mapped
3. **Common culprits**:
   - Reporter (should auto-fill with API user)
   - Priority (configure default in Kushim)
   - Components (make optional or map)

### Rate Limiting

**Symptom**: "429 Too Many Requests"

**Solutions**:
1. Jira Cloud limits:
   - Standard: 10,000 requests/hour
   - Premium: 25,000 requests/hour
2. Reduce ticket creation frequency
3. Enable ticket deduplication (default: on)
4. Contact Atlassian to increase limits

### Duplicate Tickets Created

**Symptom**: Multiple tickets for same control failure

**Solutions**:
1. Ensure deduplication is enabled:
   ```
   Settings → Integrations → Jira
   ☑ Check for existing tickets before creating
   Deduplication window: [24 hours ▼]
   ```
2. Verify label/custom field used for matching
3. Check Jira permissions (Kushim may not see existing tickets)

---

## Security Best Practices

### 1. Use Dedicated Service Account

✅ **DO**: Create `kushim-integration@acme-corp.com` Jira user
❌ **DON'T**: Use personal admin account

Steps:
1. Create new user in Jira
2. Assign to `kushim-integration` group
3. Grant project permissions (Create, Edit issues)
4. Generate API token from this account

### 2. Restrict Project Access

Limit Kushim to compliance projects only:

```
Project Permissions for kushim-integration:
  ✅ COMP (Compliance) - Create, Edit, Comment
  ✅ SEC (Security) - Create, Edit, Comment
  ❌ DEV (Development) - No access
  ❌ SALES (Sales) - No access
```

### 3. Rotate API Tokens

1. Set calendar reminder (every 90 days)
2. Generate new token
3. Update Kushim `.env`
4. Restart backend
5. Test connection
6. Revoke old token

### 4. Monitor API Usage

1. Jira → Administration → Audit log
2. Filter by user: `kushim-integration`
3. Review monthly:
   - Ticket creation volume
   - API call patterns
   - Failed authentication attempts

### 5. Secure Webhook Endpoints

If using Jira webhooks:

```env
# Generate strong secret
JIRA_WEBHOOK_SECRET="$(openssl rand -hex 32)"
```

Verify webhook signatures:
```typescript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', JIRA_WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');

if (signature !== req.headers['x-hub-signature']) {
  throw new Error('Invalid webhook signature');
}
```

---

## FAQ

**Q: Does Kushim modify or delete existing Jira tickets?**
A: No. Kushim only creates new tickets and optionally adds comments. It never modifies titles, descriptions, or deletes tickets.

**Q: Can I customize ticket templates?**
A: Yes! Settings → Integrations → Jira → Ticket Template. Supports variables like `{controlId}`, `{failureReason}`, etc.

**Q: What happens if Jira is down?**
A: Kushim queues ticket creation and retries with exponential backoff. Tickets will be created once Jira is reachable.

**Q: Can I create tickets in multiple projects?**
A: Yes! Configure project routing rules based on control type (AWS → INFRA project, GitHub → DEV project, etc.)

**Q: Does Kushim support Jira Service Desk?**
A: Yes! Use the same API token method. Set issue type to "Service Request" or "Incident".

**Q: Can I prevent ticket creation for certain controls?**
A: Yes. Settings → Compliance → Controls → [Select control] → Jira Integration → Disabled

**Q: What about Jira Data Center?**
A: Fully supported. Use Personal Access Token (Jira 8.14+) or OAuth 1.0a for older versions.

---

## Next Steps

- ✅ Configure [Slack Integration](./slack-integration.md) for ticket creation notifications
- ✅ Set up [GitHub Integration](./github-integration.md) for code security controls
- ✅ Enable [AWS Integration](./aws-integration.md) for infrastructure compliance
- 📖 Review [Remediation Workflow Guide](../guides/remediation-workflow.md)

---

## Resources

- 📚 [Jira REST API v3 Docs](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- 🔐 [Jira API Token Guide](https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/)
- 🔑 [Jira OAuth 2.0 Guide](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/)
- 📊 [Jira Webhooks](https://developer.atlassian.com/server/jira/platform/webhooks/)

---

## Need Help?

- 📧 Email: support@kushim.io
- 💬 Slack Community: [kushim-community.slack.com](https://kushim-community.slack.com)
- 📚 Documentation: [docs.kushim.io](https://docs.kushim.io)
- 🐛 Report Issues: [GitHub Issues](https://github.com/kushim/kushim/issues)
