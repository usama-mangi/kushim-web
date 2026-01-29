# Webhook Setup Guide

This guide explains how to configure webhooks for real-time synchronization with external platforms.

## Overview

Webhooks enable Kushim to receive real-time updates when events occur on connected platforms (GitHub, Slack, Jira, Google Drive). This eliminates polling delays and ensures instant data synchronization.

## Architecture

1. **Webhook Controller** - Receives webhook POST requests from platforms
2. **Signature Verification** - Validates requests using HMAC signatures
3. **Event Queue** - Queues events using BullMQ for async processing
4. **Webhook Processor** - Processes events and updates records
5. **Relationship Discovery** - Automatically links new/updated records

## Configuration

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Generate secrets with:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

GITHUB_WEBHOOK_SECRET="your_random_64_char_hex_string"
SLACK_SIGNING_SECRET="your_slack_signing_secret"
JIRA_WEBHOOK_SECRET="your_random_64_char_hex_string"
```

### 2. Platform-Specific Setup

#### GitHub Webhooks

1. Go to your GitHub repository or organization settings
2. Navigate to **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: `https://your-domain.com/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: Use the value from `GITHUB_WEBHOOK_SECRET`
   - **Events**: Select:
     - ✅ Issues
     - ✅ Issue comments
     - ✅ Pull requests
     - ✅ Pull request reviews
     - ✅ Pull request review comments
     - ✅ Pushes
     - ✅ Commit comments

4. Click **Add webhook**

**Test**: Push a commit or create an issue. Check webhook delivery in GitHub settings.

#### Slack Webhooks (Event Subscriptions)

1. Go to [Slack API Dashboard](https://api.slack.com/apps)
2. Select your Kushim app
3. Navigate to **Event Subscriptions**
4. Enable Events:
   - **Request URL**: `https://your-domain.com/webhooks/slack`
   - Wait for verification (Slack will send a challenge)

5. Subscribe to Bot Events:
   - `message.channels`
   - `message.groups`
   - `message.im`
   - `message.mpim`
   - `reaction_added`
   - `reaction_removed`

6. Click **Save Changes**
7. Reinstall app to workspace

**Note**: You must use the **Signing Secret** from Slack (found under **Basic Information**) as `SLACK_SIGNING_SECRET`.

#### Jira Webhooks

1. Log in to Jira as admin
2. Go to **Settings** → **System** → **WebHooks**
3. Click **Create a WebHook**
4. Configure:
   - **Name**: Kushim Sync
   - **Status**: Enabled
   - **URL**: `https://your-domain.com/webhooks/jira`
   - **Events**: Select:
     - ✅ created (Issue)
     - ✅ updated (Issue)
     - ✅ created (Comment)
     - ✅ updated (Comment)

5. **Optional**: Add custom header for signature:
   - Header: `X-Hub-Signature`
   - Value: Generated from `JIRA_WEBHOOK_SECRET`

6. Click **Create**

**Test**: Create or update a Jira issue. Check webhook logs in Jira settings.

#### Google Drive Push Notifications

Google Drive uses a different pattern (watch/notification channels):

1. **Setup is automatic** - No manual configuration needed
2. Kushim will register notification channels when users connect Google Drive
3. Channels auto-renew before expiration

**Implementation note**: Google webhooks are handled in `apps/api/src/webhooks/webhook.controller.ts` but channel registration happens in the Google adapter during OAuth flow.

## Testing Webhooks

### Local Development with ngrok

Platforms require public HTTPS URLs. Use ngrok for local testing:

```bash
# Install ngrok
npm install -g ngrok

# Start your API
npm run start:dev

# In another terminal, create tunnel
ngrok http 3001

# Use the ngrok URL (e.g., https://abc123.ngrok.io) in webhook configurations
# Example: https://abc123.ngrok.io/webhooks/github
```

### Manual Testing

Send test webhooks using curl:

```bash
# GitHub webhook test
PAYLOAD='{"action":"opened","issue":{"id":1,"title":"Test"}}'
SECRET="your_github_webhook_secret"
SIGNATURE="sha256=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')"

curl -X POST http://localhost:3001/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: issues" \
  -H "X-Hub-Signature-256: $SIGNATURE" \
  -H "X-GitHub-Delivery: test-123" \
  -d "$PAYLOAD"
```

### Check Processing

View webhook queue in Redis:

```bash
# Connect to Redis
redis-cli

# List webhook jobs
LRANGE bull:webhook-events:waiting 0 -1
LRANGE bull:webhook-events:active 0 -1
LRANGE bull:webhook-events:completed 0 10
LRANGE bull:webhook-events:failed 0 10
```

## Webhook Endpoints

| Platform | Endpoint | Signature Header | Event Header |
|----------|----------|------------------|--------------|
| GitHub | `/webhooks/github` | `X-Hub-Signature-256` | `X-GitHub-Event` |
| Slack | `/webhooks/slack` | `X-Slack-Signature` | `X-Slack-Request-Timestamp` |
| Jira | `/webhooks/jira` | `X-Hub-Signature` (optional) | `X-Atlassian-Webhook-Identifier` |
| Google | `/webhooks/google` | N/A | `X-Goog-Resource-State` |

## Supported Events

### GitHub
- ✅ Issues (created, updated, closed)
- ✅ Issue comments
- ✅ Pull requests (opened, updated, merged)
- ✅ PR reviews
- ✅ PR review comments
- ✅ Commits (via push events)
- ✅ Commit comments

### Slack
- ✅ Messages (channels, groups, DMs)
- ⚠️ Reactions (logged, not yet processed)

### Jira
- ✅ Issues (created, updated)
- ✅ Comments (created, updated)

### Google Drive
- ✅ File changes (detected via push notifications)
- ⚠️ Processing not yet implemented (logs only)

## Security

### HMAC Signature Verification

All webhooks verify signatures using timing-safe comparison:

```typescript
crypto.timingSafeEqual(
  Buffer.from(providedSignature),
  Buffer.from(computedSignature)
);
```

### Rate Limiting

Webhooks are subject to global rate limiting (100 req/min by default). Configure in `apps/api/src/app.module.ts`.

### Replay Protection

- **GitHub**: Uses delivery IDs (not enforced)
- **Slack**: Rejects requests older than 5 minutes
- **Jira**: No built-in replay protection
- **Google**: Sync messages ignored

## Monitoring

### Audit Logs

All webhook events are logged in the audit table:

```sql
SELECT * FROM "AuditLog" 
WHERE action = 'webhook_received' 
ORDER BY "createdAt" DESC 
LIMIT 50;
```

### Application Logs

Search logs for webhook activity:

```bash
# Development
npm run start:dev | grep webhook

# Production (structured JSON)
grep -i webhook /var/log/kushim-api.log | jq .
```

### BullMQ Dashboard (Optional)

Install Bull Board for visual queue monitoring:

```bash
npm install --save @bull-board/api @bull-board/express
```

## Troubleshooting

### Webhook Not Received

1. Check platform webhook delivery logs
2. Verify webhook URL is publicly accessible (use ngrok for local testing)
3. Check firewall/proxy settings
4. Verify SSL certificate is valid

### Signature Verification Failed

1. Confirm secret matches between `.env` and platform configuration
2. Check for trailing whitespace in secret
3. Verify raw body is being used (not parsed JSON)
4. For Slack, ensure timestamp is within 5-minute window

### Events Not Processing

1. Check webhook queue: `LRANGE bull:webhook-events:failed 0 -1`
2. View error logs: `grep -i "webhook processor" /var/log/kushim-api.log`
3. Verify Redis is running: `redis-cli ping`
4. Check database connectivity

### Duplicate Records

1. Webhooks use `createOrUpdate` based on `platformId`
2. Duplicates shouldn't occur unless `platformId` is missing
3. Check adapter logic in `webhook.processor.ts`

## Performance Considerations

### Queue Configuration

Default settings (in `webhook.service.ts`):
- **Attempts**: 3
- **Backoff**: Exponential (2s, 4s, 8s)

Adjust for high-volume workspaces:

```typescript
await this.webhookQueue.add('process-webhook', event, {
  attempts: 5,
  backoff: { type: 'exponential', delay: 1000 },
  priority: event.platform === 'slack' ? 1 : 5, // Prioritize Slack
});
```

### Rate Limiting

GitHub has webhook delivery limits:
- 5000 events/hour per repository
- Events may be batched if limit exceeded

### Scaling

For high-volume deployments:
1. Run multiple worker processes
2. Use Redis cluster
3. Partition queues by platform
4. Monitor queue depth

## Next Steps

1. ✅ Set up webhook endpoints
2. ✅ Configure secrets
3. ✅ Register webhooks with platforms
4. ✅ Test with ngrok
5. ⬜ Deploy to production
6. ⬜ Monitor webhook processing
7. ⬜ Set up alerting for failures

## Related Documentation

- [OAuth Setup Guide](../README.md#oauth-configuration)
- [Redis Configuration](../README.md#redis-optional)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [GitHub Webhooks](https://docs.github.com/en/webhooks)
- [Slack Events API](https://api.slack.com/events-api)
- [Jira Webhooks](https://developer.atlassian.com/server/jira/platform/webhooks/)
