# Environment Variables Setup Guide

This guide will help you obtain all the necessary credentials for the Kushim compliance automation platform.

## Quick Start

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Copy `.env` to backend directory:

   ```bash
   cp .env apps/backend/.env
   ```

3. Fill in the credentials following the guides below

---

## 🗄️ Database & Infrastructure (Required)

### PostgreSQL

Already configured via Docker Compose. Default credentials:

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/kushim?schema=public"
```

### Redis

Already configured via Docker Compose:

```bash
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

---

## 🔐 Authentication (Required)

### JWT Secret

Generate a secure random string:

```bash
JWT_SECRET="$(openssl rand -base64 32)"
```

---

## ☁️ AWS Integration (Optional but Recommended)

**What it does:** Monitors IAM MFA enforcement, S3 bucket encryption, and CloudTrail logging

### Step 1: Create IAM User

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → **Add users**
3. Username: `kushim-compliance-bot`
4. Select **Access key - Programmatic access**

### Step 2: Attach Policies

Attach these managed policies:

- `IAMReadOnlyAccess`
- `AmazonS3ReadOnlyAccess`
- `AWSCloudTrailReadOnlyAccess`

Or create a custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iam:ListUsers",
        "iam:GetUser",
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

### Step 3: Get Credentials

1. Download the CSV with access key ID and secret
2. Add to `.env`:
   ```bash
   AWS_REGION="us-east-1"
   AWS_ACCESS_KEY_ID="AKIA..."
   AWS_SECRET_ACCESS_KEY="..."
   ```

---

## 🐙 GitHub Integration (Optional but Recommended)

**What it does:** Verifies branch protection, commit signing, and security scanning

### Step 1: Create Personal Access Token

1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Name: `kushim-compliance`
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `read:org` (Read org and team membership)

### Step 2: Add to .env

```bash
GITHUB_TOKEN="ghp_..."
```

---

## 🔒 Okta Integration (Optional but Recommended)

**What it does:** Monitors MFA enforcement, user access, and policy compliance

### Step 1: Get Okta Domain

Your Okta domain looks like: `https://dev-12345.okta.com`

### Step 2: Create API Token

1. Go to **Security** → **API** → **Tokens**
2. Click **Create Token**
3. Name: `kushim-compliance`
4. Copy the token (you won't see it again!)

### Step 3: Add to .env

```bash
OKTA_DOMAIN="https://dev-12345.okta.com"
OKTA_API_TOKEN="00..."
```

---

## 🎫 Jira Integration (Optional - Secret Weapon!)

**What it does:** Automatically creates tickets when compliance controls fail

### Step 1: Get Jira Domain

Your Jira domain looks like: `your-company.atlassian.net`

### Step 2: Create API Token

1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click **Create API token**
3. Label: `kushim-compliance`
4. Copy the token

### Step 3: Add to .env

```bash
JIRA_DOMAIN="your-company.atlassian.net"
JIRA_EMAIL="your-email@company.com"
JIRA_API_TOKEN="ATATT..."
```

---

## 💬 Slack Integration (Optional but Recommended)

**What it does:** Sends compliance alerts, daily summaries, and health warnings

### Step 1: Create Slack App

1. Go to [Slack API](https://api.slack.com/apps)
2. Click **Create New App** → **From scratch**
3. App name: `Kushim Compliance`
4. Select your workspace

### Step 2: Enable Incoming Webhooks

1. Go to **Incoming Webhooks**
2. Toggle **Activate Incoming Webhooks** to **On**
3. Click **Add New Webhook to Workspace**
4. Select a channel (e.g., `#compliance-alerts`)
5. Click **Allow**

### Step 3: Copy Webhook URL

```bash
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T.../B.../..."
```

---

## ✅ Verification

### Check Environment Variables

```bash
cd apps/backend
npm run build
```

### Test Integrations

Start the backend:

```bash
npm run dev
```

Test health endpoints:

```bash
# Overall reliability health
curl http://localhost:3001/api/reliability/health

# Individual integrations (if configured)
curl http://localhost:3001/api/integrations/aws/health
curl http://localhost:3001/api/integrations/okta/health
curl "http://localhost:3001/api/integrations/github/health?owner=yourorg&repo=yourrepo"
```

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use different credentials for production** - Rotate keys regularly
3. **Limit IAM permissions** - Use least privilege principle
4. **Rotate API tokens** - Set expiration dates where possible
5. **Use environment-specific secrets** - Different keys for dev/staging/prod

---

## 📝 Minimal Setup (Development)

For local development, you only need:

```bash
# Required
DATABASE_URL="postgresql://postgres:password@localhost:5432/kushim?schema=public"
REDIS_HOST="localhost"
REDIS_PORT="6379"
NODE_ENV="development"
PORT="3001"
FRONTEND_URL="http://localhost:3000"
JWT_SECRET="dev-secret-change-in-production"

# Optional - Leave empty to skip integrations
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
GITHUB_TOKEN=""
OKTA_DOMAIN=""
OKTA_API_TOKEN=""
JIRA_DOMAIN=""
JIRA_EMAIL=""
JIRA_API_TOKEN=""
SLACK_WEBHOOK_URL=""
```

The backend will still run without integration credentials. Integration endpoints will fail gracefully with circuit breaker protection.

---

## 🆘 Troubleshooting

### "Environment variable not found: DATABASE_URL"

- Make sure `.env` file exists in `apps/backend/` directory
- Copy from root: `cp .env apps/backend/.env`

### "Can't reach database server"

- Start Docker services: `docker-compose up -d postgres redis`
- Check status: `docker-compose ps`

### Integration health check fails

- Verify credentials are correct
- Check API token hasn't expired
- Ensure proper permissions/scopes
- Review logs: `npm run dev` shows detailed errors

---

## 📚 Additional Resources

- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [GitHub Token Security](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [Okta API Documentation](https://developer.okta.com/docs/reference/)
- [Jira Cloud API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Slack Webhooks](https://api.slack.com/messaging/webhooks)
