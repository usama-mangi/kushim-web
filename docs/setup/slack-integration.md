# Slack Integration Setup Guide

## Overview

The Slack integration provides real-time compliance alerts and daily summaries, ensuring your team stays informed about:
- **Compliance Check Failures** (CC7.3 - Incident Response)
- **Daily Compliance Summaries** (CC7.2 - Monitoring)
- **Integration Health Warnings** (CC9.1 - Risk Assessment)
- **Evidence Collection Status** (CC7.2 - Audit Logging)

Never miss a critical compliance issue with instant Slack notifications!

---

## Prerequisites

- Slack workspace (admin or permission to create apps)
- Channel for compliance alerts (recommended: `#compliance-alerts`)
- Kushim backend running and accessible

---

## Method 1: Incoming Webhook (Recommended for Quick Start)

Incoming Webhooks are the easiest way to send messages to Slack. Perfect for getting started quickly.

### Step 1: Create Incoming Webhook

#### 1.1 Navigate to Slack Apps

1. Go to [Slack Apps](https://api.slack.com/apps)
2. Sign in to your Slack workspace
3. Click **Create New App**

#### 1.2 Choose App Creation Method

Select **From scratch**:

```
App Name: Kushim Compliance Alerts
Pick a workspace: [Your Workspace ▼]

[Create App]
```

#### 1.3 Enable Incoming Webhooks

1. In app settings, click **Incoming Webhooks** (left sidebar)
2. Toggle **Activate Incoming Webhooks** to **On**
3. Scroll down and click **Add New Webhook to Workspace**

#### 1.4 Select Channel

Choose the channel for compliance alerts:

```
Where should Kushim Compliance Alerts post?

Channels:
  #compliance-alerts (Recommended)
  #security-alerts
  #general
  
Or create a new channel: [compliance-alerts]

[Allow]
```

#### 1.5 Copy Webhook URL

After authorization, you'll see the webhook URL:

```
Webhook URL:
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX

[Copy]
```

⚠️ **Keep this URL secret!** Anyone with this URL can post to your channel.

### Step 2: Configure Kushim Backend

#### 2.1 Update Environment Variables

```bash
cd apps/backend
nano .env
```

Add Slack webhook URL:

```env
# Slack Integration
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX"
```

#### 2.2 Restart Backend

```bash
# Local development
npm run backend:dev

# Docker
docker-compose restart backend
```

### Step 3: Test Integration

#### 3.1 Test from Kushim UI

1. Navigate to **Settings** → **Integrations**
2. Find **Slack** card
3. Click **Connect**
4. Paste webhook URL
5. Click **Test Connection**

Expected message in Slack:

```
┌────────────────────────────────────────┐
│ Kushim Compliance Alerts [APP]         │
├────────────────────────────────────────┤
│ ✅ Slack Integration Test Successful   │
│                                        │
│ Kushim is now connected to this        │
│ channel and will send compliance       │
│ alerts here.                           │
│                                        │
│ Severity: INFO                         │
│ Timestamp: 2024-01-15T10:30:00Z       │
│                                        │
│ Kushim Compliance Platform             │
└────────────────────────────────────────┘
```

#### 3.2 Test from Command Line

```bash
curl -X POST "$SLACK_WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Test from Kushim Backend",
    "attachments": [{
      "color": "#36a64f",
      "title": "Connection Test",
      "text": "If you see this, Slack integration is working!",
      "footer": "Kushim Compliance Platform"
    }]
  }'
```

---

## Method 2: OAuth App (Advanced)

OAuth apps provide more features like interactive messages, slash commands, and granular permissions.

### Step 1: Create Slack App

#### 1.1 Create App

1. Go to [Slack Apps](https://api.slack.com/apps)
2. Click **Create New App** → **From scratch**
3. **App Name**: `Kushim Compliance Platform`
4. **Workspace**: Select your workspace

#### 1.2 Configure OAuth Scopes

1. Click **OAuth & Permissions** (left sidebar)
2. Scroll to **Scopes** → **Bot Token Scopes**
3. Click **Add an OAuth Scope** and add:

```
Required Scopes:
  ✅ chat:write - Send messages as @kushim
  ✅ chat:write.public - Send to channels without joining
  ✅ channels:read - View channel list
  ✅ groups:read - View private channel list
  ✅ files:write - Upload evidence files (optional)

Optional Scopes (for advanced features):
  ⚪ commands - Create slash commands
  ⚪ reactions:write - Add emoji reactions
  ⚪ users:read - Read user information
```

#### 1.3 Set Redirect URL

Scroll to **Redirect URLs** and add:

```
Redirect URL:
  http://localhost:3001/api/integrations/slack/callback (local dev)
  https://app.kushim.io/api/integrations/slack/callback (production)

[Add]  [Save URLs]
```

#### 1.4 Install App to Workspace

1. Scroll to top of **OAuth & Permissions** page
2. Click **Install to Workspace**
3. Review permissions:

```
Kushim Compliance Platform is requesting permission to:
  • Send messages as @kushim
  • View channels
  • Upload files

[Allow]
```

#### 1.5 Copy Bot Token

After installation:

```
OAuth Tokens for Your Workspace

Bot User OAuth Token:
xoxb-YOUR-BOT-TOKEN-WILL-APPEAR-HERE

[Copy]
```

### Step 2: Configure Kushim Backend for OAuth

```bash
cd apps/backend
nano .env
```

```env
# Slack OAuth Integration
SLACK_BOT_TOKEN="xoxb-YOUR-BOT-TOKEN-HERE"
SLACK_SIGNING_SECRET="your-signing-secret-here" # From Basic Information page
SLACK_CLIENT_ID="your.client.id"
SLACK_CLIENT_SECRET="your-client-secret-here"
```

### Step 3: Configure Channel

In Kushim UI:

```
Default Alert Channel: [#compliance-alerts ▼]

Secondary Channels:
  Critical alerts → [#incidents ▼]
  Daily summaries → [#compliance-summary ▼]

[Save Configuration]
```

---

## Configure Alert Settings

### Alert Types

Configure which alerts to send to Slack:

```
Alert Settings:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Compliance Check Failures:
  ☑ Critical severity (always notify)
  ☑ High severity
  ☑ Medium severity
  ☐ Low severity

Integration Health:
  ☑ Integration connection failures
  ☑ API rate limit warnings
  ☐ Successful reconnections

Evidence Collection:
  ☑ Evidence collection failures
  ☐ Evidence collected successfully

Daily Summaries:
  ☑ Daily compliance summary (8:00 AM)
  ☑ Weekly summary (Monday 9:00 AM)
  ☐ Monthly summary

[Save Alert Settings]
```

### Alert Format

Customize how alerts appear in Slack:

#### Critical Compliance Failure

```
┌────────────────────────────────────────┐
│ Kushim Compliance Alerts [APP]         │
├────────────────────────────────────────┤
│ 🚨 Critical Compliance Failure         │
│                                        │
│ AWS IAM MFA Enforcement                │
│                                        │
│ 12 out of 150 users (8%) do not have  │
│ MFA enabled. This violates SOC 2      │
│ control CC6.1 (Logical Access).       │
│                                        │
│ Control ID: AWS_IAM_MFA               │
│ Evidence ID: ev_abc123def456          │
│ Severity: CRITICAL                     │
│ Timestamp: 2024-01-15T14:30:00Z       │
│                                        │
│ 📋 View Evidence │ 🔧 Remediate        │
│                                        │
│ Kushim Compliance Platform             │
└────────────────────────────────────────┘
```

#### Daily Summary

```
┌────────────────────────────────────────┐
│ Kushim Compliance Alerts [APP]         │
├────────────────────────────────────────┤
│ 📊 Daily Compliance Summary            │
│ January 15, 2024                       │
│                                        │
│ Overall Status: ⚠️ Needs Attention     │
│ Compliance Score: 87.5%                │
│                                        │
│ Controls:                              │
│ ✅ Passing: 42                         │
│ ⚠️  Warning: 3                          │
│ ❌ Failing: 2                          │
│                                        │
│ Top Issues:                            │
│ 1. [AWS_IAM_MFA] 12 users without MFA │
│ 2. [GITHUB_BRANCH] 5 repos unprotected│
│                                        │
│ 🎫 Jira Tickets Created: 2             │
│ 📈 View Dashboard                      │
│                                        │
│ Kushim Compliance Platform             │
└────────────────────────────────────────┘
```

### Alert Routing

Route different alert types to different channels:

```
Alert Routing:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Critical Failures:
  Channel: [#incidents ▼]
  @mention: [@security-team ▼]
  
High Severity:
  Channel: [#compliance-alerts ▼]
  @mention: [@compliance-lead ▼]
  
Medium/Low:
  Channel: [#compliance-alerts ▼]
  @mention: [None ▼]
  
Daily Summaries:
  Channel: [#compliance-summary ▼]
  Time: [08:00 AM ▼] [UTC ▼]

[Save Routing]
```

---

## Advanced Features

### 1. Slash Commands

Create custom slash commands for team interactions:

#### Setup Slash Command

1. In Slack App settings → **Slash Commands**
2. Click **Create New Command**

```
Command: /compliance
Request URL: https://app.kushim.io/api/slack/commands/compliance
Short Description: Check compliance status
Usage Hint: [status|check|report]

[Save]
```

#### Example Usage

In Slack:
```
/compliance status
```

Response:
```
Current Compliance Status:
━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Overall: 87.5%
✅ AWS: 95%
⚠️  GitHub: 75%
✅ Okta: 92%

Last check: 2 hours ago
Next check: in 22 hours

Run manual check: /compliance check
View full report: /compliance report
```

### 2. Interactive Buttons

Add action buttons to alerts:

```typescript
// apps/backend/src/integrations/slack/interactive-alerts.ts
const alertPayload = {
  attachments: [{
    color: '#ff0000',
    title: '🚨 Critical Compliance Failure',
    text: 'AWS IAM MFA Enforcement failed',
    actions: [
      {
        type: 'button',
        text: '🔧 Create Jira Ticket',
        url: 'https://app.kushim.io/remediate/AWS_IAM_MFA',
        style: 'primary',
      },
      {
        type: 'button',
        text: '📋 View Evidence',
        url: 'https://app.kushim.io/evidence/ev_abc123',
      },
      {
        type: 'button',
        text: '✅ Acknowledge',
        value: 'acknowledge',
        confirm: {
          title: 'Acknowledge alert?',
          text: 'This will mark the alert as seen.',
          ok_text: 'Yes',
          dismiss_text: 'No',
        },
      },
    ],
  }],
};
```

### 3. Thread Replies

Keep related alerts organized in threads:

```typescript
// apps/backend/src/integrations/slack/threads.ts
export class SlackThreadManager {
  async sendComplianceUpdate(controlId: string, message: string) {
    // Find original alert message
    const parentMessage = await this.findAlertByControlId(controlId);
    
    if (parentMessage) {
      // Reply in thread
      await slackClient.chat.postMessage({
        channel: CHANNEL_ID,
        thread_ts: parentMessage.ts,
        text: `✅ Update: ${message}`,
      });
    }
  }
}
```

Example thread:
```
🚨 AWS IAM MFA Enforcement failed (12 users)
  └─ 🎫 Jira ticket COMP-142 created
  └─ ⏳ Remediation in progress (6/12 users fixed)
  └─ ✅ All users now have MFA enabled
  └─ 🔄 Re-running compliance check...
  └─ ✅ Control now passing!
```

### 4. File Uploads

Upload compliance reports to Slack:

```typescript
// Upload CSV evidence file
await slackClient.files.upload({
  channels: CHANNEL_ID,
  file: fs.createReadStream('compliance-report.csv'),
  filename: 'daily-compliance-report-2024-01-15.csv',
  title: 'Daily Compliance Report - Jan 15',
  initial_comment: '📊 Daily compliance report attached',
});
```

### 5. User Mentions

Mention specific users for urgent issues:

```typescript
// apps/backend/src/integrations/slack/mentions.ts
const alertWithMention = {
  channel: CHANNEL_ID,
  text: `<@U12345678> Critical compliance failure requires immediate attention!`,
  attachments: [/* ... */],
};
```

Mention groups:
```
<!here> - Notify active channel members
<!channel> - Notify all channel members
<!everyone> - Notify entire workspace (use sparingly!)
<@U12345678> - Mention specific user by ID
```

---

## Troubleshooting

### Webhook Not Posting to Slack

**Symptom**: No messages appearing in Slack channel

**Solutions**:

1. **Verify webhook URL**:
```bash
# Test webhook manually
curl -X POST "YOUR_WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test message"}'
```

2. **Check URL format**: Should start with `https://hooks.slack.com/services/`

3. **Verify channel still exists**: Webhook becomes invalid if channel is deleted

4. **Check backend logs**:
```bash
docker-compose logs backend | grep -i slack
# Look for: "Slack webhook URL configured" or error messages
```

### OAuth Token Invalid

**Symptom**: "invalid_auth" or "token_revoked" errors

**Solutions**:

1. **Reinstall app**: Slack App → OAuth & Permissions → Reinstall to Workspace

2. **Copy new token**: Token changes after reinstallation

3. **Check token format**: Bot token starts with `xoxb-`, user token with `xoxp-`

4. **Verify scopes**: Ensure `chat:write` scope is granted

### Messages Missing Formatting

**Symptom**: Plain text appears instead of rich formatting

**Solutions**:

1. **Use attachments API**: Richer formatting than basic text
```javascript
{
  text: "Fallback text",
  attachments: [{
    color: "#ff0000",
    title: "Formatted title",
    fields: [...]
  }]
}
```

2. **Enable mrkdwn**: For markdown formatting
```javascript
{
  mrkdwn: true,
  text: "*Bold* _italic_ `code`"
}
```

### Rate Limiting

**Symptom**: "rate_limited" error from Slack API

**Solutions**:

1. **Slack rate limits**:
   - Webhooks: ~1 message per second
   - Bot API: Varies by method (typically 1-100/min)

2. **Implement message queuing**:
```typescript
// Already implemented in Kushim
// apps/backend/src/integrations/slack/rate-limiter.ts
const rateLimiter = new RateLimiter({
  maxRequests: 50,
  perSeconds: 60,
});
```

3. **Batch alerts**: Combine multiple failures into one message

### Channel Not Found

**Symptom**: "channel_not_found" error

**Solutions**:

1. **Invite bot to channel**:
   - In Slack: `/invite @kushim` in the target channel
   
2. **Use channel ID instead of name**:
```env
SLACK_CHANNEL_ID="C01234567" # More reliable than #channel-name
```

3. **Verify bot permissions**: Needs `channels:read` scope

---

## Security Best Practices

### 1. Secure Webhook URLs

✅ **DO**:
- Store webhook URLs in environment variables
- Use secrets manager in production
- Rotate webhooks quarterly
- Limit channel access to compliance team

❌ **DON'T**:
- Commit webhook URLs to git
- Share URLs in public channels
- Use same webhook across multiple apps

### 2. Validate Webhook Signatures (OAuth)

For OAuth apps, verify request signatures:

```typescript
// apps/backend/src/integrations/slack/verify-signature.ts
import crypto from 'crypto';

export function verifySlackSignature(
  signingSecret: string,
  requestTimestamp: string,
  requestBody: string,
  requestSignature: string,
): boolean {
  // Prevent replay attacks (>5 min old)
  const timestamp = parseInt(requestTimestamp);
  if (Math.abs(Date.now() / 1000 - timestamp) > 300) {
    return false;
  }

  // Verify signature
  const baseString = `v0:${requestTimestamp}:${requestBody}`;
  const signature = 'v0=' + crypto
    .createHmac('sha256', signingSecret)
    .update(baseString)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(requestSignature),
  );
}
```

### 3. Limit Sensitive Data

❌ **Don't send** to Slack:
- API keys or credentials
- Full AWS access keys
- Database connection strings
- Customer PII

✅ **Do send**:
- Control IDs and status
- Evidence IDs (obfuscated)
- Summary statistics
- Links to Kushim dashboard

### 4. Channel Permissions

Set up private compliance channel:

1. Create `#compliance-alerts-private` (private channel)
2. Invite only: compliance team, security team, executives
3. Configure critical alerts to this channel
4. Public `#compliance-summary` for general updates

### 5. Audit Slack Usage

Monitor Slack API calls:

1. Slack Workspace Settings → Audit Logs (Enterprise only)
2. Filter by app: "Kushim Compliance Platform"
3. Review monthly for:
   - Excessive API calls
   - Failed authentication
   - Unexpected channels

---

## FAQ

**Q: Can Kushim read messages from Slack?**
A: No. Kushim only sends messages. It does not read, modify, or delete messages.

**Q: What happens if Slack is down?**
A: Kushim will queue alerts and retry with exponential backoff. You won't lose critical notifications.

**Q: Can I send alerts to multiple channels?**
A: Yes! Configure alert routing to send different severity levels to different channels.

**Q: Does this work with Slack Enterprise Grid?**
A: Yes. Same setup process. Consider org-wide app installation for multi-workspace deployments.

**Q: Can I use email instead of Slack?**
A: Email integration coming in Phase 2. Current workaround: Use Slack's email forwarding feature.

**Q: What about Microsoft Teams?**
A: Teams integration planned for Phase 3. Incoming webhooks work similarly to Slack.

**Q: Can I customize alert message templates?**
A: Yes! Settings → Integrations → Slack → Message Templates

**Q: How do I mute alerts temporarily?**
A: Settings → Integrations → Slack → Pause Alerts (select duration: 1h, 4h, 24h, 7d)

---

## Next Steps

- ✅ Configure [Jira Integration](./jira-integration.md) for automatic ticket creation
- ✅ Set up [AWS Integration](./aws-integration.md) to trigger infrastructure alerts
- ✅ Enable [GitHub Integration](./github-integration.md) for code security alerts
- 📖 Review [Alert Response Playbook](../guides/alert-response.md)

---

## Resources

- 📚 [Slack API Documentation](https://api.slack.com/docs)
- 🔐 [Incoming Webhooks Guide](https://api.slack.com/messaging/webhooks)
- 🔑 [Slack OAuth Guide](https://api.slack.com/authentication/oauth-v2)
- 💬 [Message Formatting](https://api.slack.com/reference/surfaces/formatting)
- 🎨 [Block Kit Builder](https://app.slack.com/block-kit-builder) (Interactive message designer)

---

## Need Help?

- 📧 Email: support@kushim.io
- 💬 Slack Community: [kushim-community.slack.com](https://kushim-community.slack.com)
- 📚 Documentation: [docs.kushim.io](https://docs.kushim.io)
- 🐛 Report Issues: [GitHub Issues](https://github.com/kushim/kushim/issues)
