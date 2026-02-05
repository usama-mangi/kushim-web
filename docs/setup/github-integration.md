# GitHub Integration Setup Guide

## Overview

The GitHub integration enables Kushim to automatically verify SOC 2 compliance controls related to:
- **Branch Protection** (CC8.1 - Change Management)
- **Commit Signing** (CC6.2 - Authentication)
- **Security Scanning** (CC7.1 - Security Monitoring)
- **Code Review Requirements** (CC8.1 - Change Approval)

This guide covers both Personal Access Token (PAT) and OAuth App setup methods.

---

## Prerequisites

- GitHub account with admin access to target repositories
- For organizations: Owner or Admin role
- Kushim backend running and accessible

---

## Method 1: Personal Access Token (Recommended for Quick Start)

### Step 1: Generate Personal Access Token

#### 1.1 Navigate to GitHub Settings

1. Sign in to [GitHub.com](https://github.com)
2. Click your profile picture (top-right)
3. Select **Settings**
4. Scroll down to **Developer settings** (bottom of left sidebar)
5. Click **Personal access tokens** → **Tokens (classic)**
6. Click **Generate new token** → **Generate new token (classic)**

#### 1.2 Configure Token

**Note**: Enter a descriptive note for the token

```
Token name: Kushim Compliance Platform
```

**Expiration**: Select `90 days` (recommended) or `No expiration` (requires periodic review)

**Select scopes**:

✅ **Required Scopes**:
- `repo` (Full control of private repositories)
  - `repo:status` - Access commit status
  - `repo_deployment` - Access deployment status
  - `public_repo` - Access public repositories
  - `repo:invite` - Access repository invitations
  - `security_events` - Read security events

- `read:org` (Read org and team membership, read org projects)
  - Used to list organization repositories

⚠️ **Important**: Do NOT select `admin:org` or `delete_repo` scopes

#### 1.3 Generate and Save Token

1. Scroll to bottom and click **Generate token**
2. **Copy the token immediately** (e.g., `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
3. Store in password manager - you won't see it again!

### Step 2: Configure Kushim Backend

#### 2.1 Update Environment Variables

```bash
cd apps/backend
nano .env
```

Add the GitHub token:

```env
# GitHub Integration
GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

#### 2.2 Restart Backend

```bash
# Local development
npm run backend:dev

# Docker
docker-compose restart backend
```

### Step 3: Connect in Kushim UI

1. Navigate to **Settings** → **Integrations**
2. Find **GitHub** card
3. Click **Connect with Token**
4. Paste your Personal Access Token
5. Click **Verify Connection**

#### Expected Result:
```
✅ Token Valid
✅ Access: 42 repositories
✅ Organization: acme-corp
✅ Scopes: repo, read:org
```

### Step 4: Select Repositories

1. After successful connection, click **Configure**
2. Select repositories to monitor:
   - **All repositories** (recommended for comprehensive compliance)
   - **Specific repositories** (select from list)
3. Click **Save Selection**

### Step 5: Run Initial Compliance Check

1. Click **Run Compliance Check**
2. Wait for completion (~1-2 minutes for 10 repos)
3. Review results:
   - **Branch Protection Status**: % of main branches protected
   - **Required Reviews**: Enforcement of code review
   - **Signed Commits**: Verification of commit signing

---

## Method 2: OAuth App (Recommended for Production)

OAuth provides better security and easier token management for team environments.

### Step 1: Create GitHub OAuth App

#### 1.1 Navigate to OAuth Apps

**For Personal Account**:
1. GitHub Settings → Developer settings
2. Click **OAuth Apps**
3. Click **New OAuth App**

**For Organization**:
1. Go to your organization page
2. Click **Settings** → **Developer settings**
3. Click **OAuth Apps** → **New OAuth App**

#### 1.2 Configure OAuth App

Fill in the application details:

```
Application name: Kushim Compliance Platform
Homepage URL: https://app.kushim.io
                (or http://localhost:3000 for local dev)

Authorization callback URL: https://app.kushim.io/api/integrations/github/callback
                            (or http://localhost:3001/api/integrations/github/callback for local)

Application description: Automated SOC 2 compliance monitoring for GitHub repositories
```

#### 1.3 Register Application

1. Click **Register application**
2. You'll be redirected to app details page
3. Note down:
   - **Client ID** (e.g., `Iv1.a1b2c3d4e5f6g7h8`)
   - Click **Generate a new client secret**
   - **Client Secret** (e.g., `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`)

⚠️ **Save Client Secret immediately** - it's only shown once!

### Step 2: Configure Kushim Backend for OAuth

#### 2.1 Add OAuth Environment Variables

```bash
cd apps/backend
nano .env
```

```env
# GitHub OAuth Configuration
GITHUB_CLIENT_ID="Iv1.a1b2c3d4e5f6g7h8"
GITHUB_CLIENT_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
GITHUB_CALLBACK_URL="http://localhost:3001/api/integrations/github/callback"
```

#### 2.2 Restart Backend

```bash
npm run backend:dev
# or
docker-compose restart backend
```

### Step 3: Connect via OAuth Flow

#### 3.1 Initiate OAuth

1. In Kushim UI, go to **Settings** → **Integrations**
2. Find **GitHub** card
3. Click **Connect with GitHub** button
4. You'll be redirected to GitHub

#### 3.2 Authorize Application

GitHub will show authorization screen:

```
Kushim Compliance Platform by [your-org]
wants to access your GitHub account

This application will be able to:
✓ Read access to code
✓ Read access to metadata and commit statuses
✓ Read access to organization membership
✓ Read access to security events

Authorize [your-org]     [Cancel]
```

Click **Authorize [your-org]**

#### 3.3 Grant Organization Access

If using organization repositories:

1. After authorization, you'll see organization access screen
2. Click **Grant** next to your organization
3. Organization admins may need to approve (depends on org settings)

#### 3.4 Complete Connection

After authorization, you'll be redirected back to Kushim with success message:

```
✅ GitHub Connected Successfully
Connected as: @your-username
Organizations: acme-corp, dev-team-org
Repositories: 42 accessible
```

---

## Step 6: Configure Repository Monitoring

### 6.1 Select Repositories

1. Click **Configure Repositories** button
2. Choose monitoring scope:
   - **All current and future repositories** (recommended)
   - **Specific repositories only**

#### For Specific Repositories:
```
Search repositories...
☑ acme-corp/api-backend
☑ acme-corp/web-frontend
☑ acme-corp/mobile-app
☐ acme-corp/internal-tools
☐ acme-corp/archived-project

[Select All] [Deselect All]
```

3. Click **Save Selection**

### 6.2 Configure Branch Protection Checks

Select which branch patterns to monitor:

```
Branch patterns to monitor:
☑ main
☑ master
☑ production
☐ develop
☐ staging

Add custom pattern: [release/*    ] [Add]
```

### 6.3 Set Check Frequency

```
Compliance check schedule:
⚪ Every 6 hours
⚫ Daily at 2:00 AM UTC
⚪ Weekly on Monday
⚪ Manual only

[Save Configuration]
```

---

## Understanding Compliance Checks

### 1. Branch Protection (CC8.1)

**What it checks**:
- Main/production branches have protection rules enabled
- Required pull request reviews before merging
- Required status checks passing
- Restrictions on who can push

**SOC 2 Requirement**: Changes require approval before deployment

**How to fix**:
1. Go to repository → Settings → Branches
2. Add branch protection rule for `main`
3. Enable:
   - ✅ Require pull request reviews before merging (minimum 1 reviewer)
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators
4. Click **Create** or **Save changes**

### 2. Commit Signing (CC6.2)

**What it checks**: Commits are signed with GPG/SSH keys

**SOC 2 Requirement**: Verify identity of code contributors

**How to fix**:
1. Set up GPG key: [GitHub GPG Guide](https://docs.github.com/en/authentication/managing-commit-signature-verification/generating-a-new-gpg-key)
2. Add to GitHub: Settings → SSH and GPG keys → New GPG key
3. Configure git locally:
```bash
git config --global user.signingkey YOUR_GPG_KEY_ID
git config --global commit.gpgsign true
```
4. Enable required signed commits in branch protection rules

### 3. Security Scanning (CC7.1)

**What it checks**:
- Dependabot alerts enabled
- Code scanning (CodeQL) enabled
- Secret scanning enabled

**SOC 2 Requirement**: Continuous security monitoring

**How to fix**:
1. Repository → Settings → Security & analysis
2. Enable:
   - ✅ Dependency graph
   - ✅ Dependabot alerts
   - ✅ Dependabot security updates
   - ✅ Secret scanning (requires GitHub Advanced Security for private repos)
   - ✅ Code scanning

---

## Troubleshooting

### Token Authentication Failed

**Symptom**: "401 Unauthorized" or "Bad credentials"

**Solutions**:
1. Verify token is correctly copied (no extra spaces)
2. Check token hasn't expired
3. Ensure token has required scopes (`repo`, `read:org`)
4. Generate new token if needed

```bash
# Test token manually
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
```

### OAuth Callback Error

**Symptom**: "Redirect URI mismatch" error during OAuth flow

**Solutions**:
1. Verify callback URL in GitHub OAuth app matches exactly:
   - Local: `http://localhost:3001/api/integrations/github/callback`
   - Production: `https://app.kushim.io/api/integrations/github/callback`
2. No trailing slash in callback URL
3. Check backend `GITHUB_CALLBACK_URL` matches OAuth app setting

### Organization Repositories Not Showing

**Symptom**: Personal repos visible but org repos missing

**Solutions**:
1. **For PAT**: Ensure `read:org` scope is selected
2. **For OAuth**: Grant organization access after authorization
3. Check organization settings → Third-party access
4. Organization admin may need to approve application

### Rate Limiting Issues

**Symptom**: "403 API rate limit exceeded"

**Solutions**:
1. Authenticated requests have 5,000 req/hour limit (should be sufficient)
2. Check if token is being sent correctly
3. For large organizations, consider reducing check frequency
4. GitHub Enterprise has higher limits

```bash
# Check rate limit status
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/rate_limit
```

### Branch Protection Data Not Updating

**Symptom**: Changes to branch protection not reflected in Kushim

**Solutions**:
1. Wait 5-10 minutes for GitHub API cache to update
2. Trigger manual compliance check
3. Verify Kushim has access to repository settings (requires `repo` scope)

---

## Security Best Practices

### 1. Token Security

✅ **DO**:
- Use fine-grained personal access tokens (beta) when available
- Set token expiration (90 days recommended)
- Rotate tokens quarterly
- Store tokens in secrets manager (production)

❌ **DON'T**:
- Commit tokens to git repositories
- Share tokens via Slack/email
- Grant unnecessary scopes

### 2. OAuth App Security

✅ **DO**:
- Use organization-owned OAuth apps for team deployments
- Regularly review authorized applications
- Revoke unused integrations

### 3. Repository Access

✅ **DO**:
- Use least privilege principle (monitor only needed repos)
- Audit Kushim's access quarterly
- Remove access to archived repositories

### 4. Audit Logging

Monitor Kushim's GitHub API usage:

1. Organization Settings → Audit log
2. Filter by: Application: "Kushim Compliance Platform"
3. Review API calls monthly

---

## Advanced Configuration

### Webhook Integration (Real-time Updates)

For instant compliance updates when branch protection changes:

#### Create Webhook

1. Repository → Settings → Webhooks → Add webhook
2. **Payload URL**: `https://app.kushim.io/api/webhooks/github`
3. **Content type**: `application/json`
4. **Secret**: Generate strong secret (save for backend config)
5. **Events**: Select individual events
   - ✅ Branch protection rules
   - ✅ Pushes
   - ✅ Pull requests
   - ✅ Repository vulnerability alerts
6. Click **Add webhook**

#### Configure Backend

```env
GITHUB_WEBHOOK_SECRET="your-webhook-secret"
```

### GitHub Enterprise Server

For on-premise GitHub Enterprise:

```env
GITHUB_API_URL="https://github.your-company.com/api/v3"
GITHUB_TOKEN="your-enterprise-token"
```

### Multiple GitHub Organizations

To monitor multiple organizations:

```env
GITHUB_TOKENS_JSON='{"org1": "token1", "org2": "token2"}'
```

Or configure via UI with separate integrations per organization.

---

## FAQ

**Q: Can Kushim modify my repositories or code?**
A: No. Kushim only reads repository metadata and settings. It cannot push code, create issues, or modify settings.

**Q: What happens if I revoke Kushim's access?**
A: Compliance checks will fail. Historical evidence remains stored. Re-authorize to resume monitoring.

**Q: Does Kushim access private repository code?**
A: Kushim reads metadata (branch names, protection rules) but does NOT download or analyze source code contents.

**Q: How much does GitHub API usage cost?**
A: GitHub API access is free. Rate limits are 5,000 requests/hour (authenticated), sufficient for most use cases.

**Q: Can I monitor GitHub Actions workflows?**
A: Yes! Coming in Phase 2. Current version focuses on branch protection and security scanning.

**Q: What about GitLab or Bitbucket?**
A: Currently GitHub only. GitLab/Bitbucket support planned for Phase 3.

---

## Next Steps

- ✅ Configure [AWS Integration](./aws-integration.md) for infrastructure compliance
- ✅ Set up [Jira Integration](./jira-integration.md) for automatic remediation tickets
- ✅ Enable [Slack Integration](./slack-integration.md) for real-time alerts
- 📖 Read [Branch Protection Best Practices](../guides/branch-protection.md)

---

## Resources

- 📚 [GitHub Branch Protection Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- 🔐 [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- 🔑 [Personal Access Token Guide](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- 📊 [GitHub API Rate Limits](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)

---

## Need Help?

- 📧 Email: support@kushim.io
- 💬 Slack Community: [kushim-community.slack.com](https://kushim-community.slack.com)
- 📚 Documentation: [docs.kushim.io](https://docs.kushim.io)
- 🐛 Report Issues: [GitHub Issues](https://github.com/kushim/kushim/issues)
