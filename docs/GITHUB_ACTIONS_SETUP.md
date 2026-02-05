# GitHub Actions Secrets Setup

This document explains how to configure GitHub Actions secrets for CI/CD automation.

## Required Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Vercel Secrets

1. **VERCEL_TOKEN**
   - Go to [Vercel Account Settings → Tokens](https://vercel.com/account/tokens)
   - Click "Create Token"
   - Name: `GitHub Actions CI/CD`
   - Scope: Full Account
   - Copy and add to GitHub secrets

2. **VERCEL_ORG_ID**
   - Run locally: `cd apps/web && npx vercel link`
   - Find in `.vercel/project.json` → `orgId`
   - Or get from Vercel project settings

3. **VERCEL_PROJECT_ID**
   - Run locally: `cd apps/web && npx vercel link`
   - Find in `.vercel/project.json` → `projectId`
   - Or get from Vercel project settings

### Render Secrets

4. **RENDER_DEPLOY_HOOK**
   - Go to your Render service → **Settings** → **Deploy Hook**
   - Click "Create Deploy Hook"
   - Name: `GitHub Actions`
   - Copy the webhook URL
   - Format: `https://api.render.com/deploy/srv-xxxxx?key=xxxxx`

5. **BACKEND_URL**
   - Your production backend URL
   - Example: `https://kushim-backend.onrender.com`
   - Or custom domain: `https://api.kushim.com`

### Optional Secrets

6. **CODECOV_TOKEN** (for code coverage)
   - Go to [Codecov](https://codecov.io/)
   - Add your repository
   - Copy the upload token
   - Add to GitHub secrets

## Vercel CLI Setup (Local)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Link to your project
cd apps/web
vercel link

# This creates .vercel/project.json with:
# - orgId
# - projectId
```

## Environment Variables in GitHub

For the **production** environment:

Go to **Settings** → **Environments** → **production** → **Environment secrets**

These are used during deployment:

```bash
BACKEND_URL=https://your-backend.onrender.com
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-org-id>
VERCEL_PROJECT_ID=<your-project-id>
RENDER_DEPLOY_HOOK=https://api.render.com/deploy/srv-xxxxx?key=xxxxx
```

## Workflow Triggers

The CI/CD workflow runs on:

- **Push to `main`** → Runs tests + deploys to production
- **Push to `develop`** → Runs tests only
- **Pull requests** → Runs tests + E2E tests

## Testing the Workflow

1. **Create a test branch:**
   ```bash
   git checkout -b test-deployment
   ```

2. **Make a small change:**
   ```bash
   echo "# Test" >> README.md
   git add README.md
   git commit -m "Test CI/CD workflow"
   git push origin test-deployment
   ```

3. **Create a PR:**
   - Go to GitHub → Pull Requests → New PR
   - Select `test-deployment` → `develop`
   - Watch the workflow run

4. **Check the results:**
   - Go to **Actions** tab
   - See all jobs: Backend, Frontend, E2E, Security
   - Review logs if any fail

## Troubleshooting

### "Secret not found"

- Ensure secret name matches exactly (case-sensitive)
- Verify secret is in the correct environment
- Regenerate the secret and update

### Vercel deployment fails

```bash
# Re-link the project
cd apps/web
vercel link --yes

# Get new IDs
cat .vercel/project.json

# Update GitHub secrets
```

### Render deployment fails

- Verify deploy hook URL is correct
- Check Render service logs
- Ensure main branch is selected for auto-deploy

### Health check fails

- Ensure backend is fully deployed
- Check health endpoints manually
- Increase wait time in workflow (currently 60s)

## Security Best Practices

✅ **Do:**
- Rotate tokens every 90 days
- Use least-privilege tokens
- Enable branch protection rules
- Review deployment logs

❌ **Don't:**
- Commit secrets to code
- Share tokens in chat/email
- Use personal tokens for CI/CD
- Grant more permissions than needed

## Advanced: Manual Deployment

Trigger deployment manually without pushing code:

```bash
# Trigger workflow via GitHub CLI
gh workflow run ci-cd.yml --ref main

# Or via API
curl -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/YOUR_ORG/YOUR_REPO/actions/workflows/ci-cd.yml/dispatches \
  -d '{"ref":"main"}'
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel GitHub Integration](https://vercel.com/docs/git/vercel-for-github)
- [Render Deploy Hooks](https://render.com/docs/deploy-hooks)
