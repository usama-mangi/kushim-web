# GitHub Security Controls Setup Guide

This guide helps you configure your GitHub repositories to pass SOC 2 compliance checks.

## Overview

When Kushim scans your GitHub repositories, it checks for three main security controls:

1. **Branch Protection** (CC7.1.1, CC8.1.2) - Ensures code changes go through review
2. **Commit Signing** (CC8.1.3) - Verifies commit authenticity  
3. **Repository Security** (CC7.2.1, CC7.2.2) - Enables vulnerability scanning

## Current Status Explained

### PASS ✅
All required security features are enabled and configured correctly.

### WARNING ⚠️
Some security features are partially configured. You can still achieve compliance with warnings, but it's recommended to address them.

### FAIL ❌
Critical security features are missing. These must be fixed to achieve full compliance.

---

## 1. Branch Protection Setup

**Why it matters:** Prevents unauthorized code changes and ensures peer review.

**Current Issue:** Main/master branches are not protected.

### Fix Steps:

1. Go to your repository on GitHub
2. Click **Settings** → **Branches**
3. Under "Branch protection rules", click **Add rule**
4. Configure:
   - **Branch name pattern:** `main` (or `master`)
   - ✅ **Require a pull request before merging**
   - ✅ **Require approvals:** At least 1
   - ✅ **Dismiss stale pull request approvals when new commits are pushed**
   - ✅ **Require status checks to pass before merging** (if you have CI/CD)
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Include administrators** (recommended)
5. Click **Create** or **Save changes**

**Repeat for all critical branches (main, master, production, staging).**

### Verification:

After setup, re-run compliance scan. Control **CC8.1.2** should change from FAIL → PASS.

---

## 2. Commit Signing Setup

**Why it matters:** Ensures commits are from verified authors (SOC 2 CC6.2 requirement).

**Current Issue:** Less than 80% of commits are GPG/SSH signed.

### Fix Steps:

#### Option A: GPG Signing (Recommended)

1. **Generate GPG key:**
   ```bash
   gpg --full-generate-key
   # Choose: RSA and RSA, 4096 bits, no expiration
   ```

2. **Get your GPG key ID:**
   ```bash
   gpg --list-secret-keys --keyid-format=long
   # Copy the key ID (after sec rsa4096/)
   ```

3. **Configure Git to use GPG:**
   ```bash
   git config --global user.signingkey YOUR_KEY_ID
   git config --global commit.gpgsign true
   ```

4. **Add GPG key to GitHub:**
   ```bash
   gpg --armor --export YOUR_KEY_ID
   # Copy the output (including BEGIN/END lines)
   ```
   - Go to GitHub **Settings** → **SSH and GPG keys** → **New GPG key**
   - Paste the key

#### Option B: SSH Signing (Simpler)

1. **Use existing SSH key or generate new:**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. **Configure Git to use SSH:**
   ```bash
   git config --global gpg.format ssh
   git config --global user.signingkey ~/.ssh/id_ed25519.pub
   git config --global commit.gpgsign true
   ```

3. **Add SSH key as signing key on GitHub:**
   - Go to GitHub **Settings** → **SSH and GPG keys** → **New SSH key**
   - Choose **Signing Key** as the key type
   - Paste your public key

### Verification:

After setup, your next commits will be signed. After 20+ signed commits, re-run scan. Control **CC8.1.3** should change from WARNING → PASS.

---

## 3. Repository Security Features

**Why it matters:** Automatically detects vulnerabilities in dependencies and code.

**Current Issue:** Security score below 75% (security features disabled).

### Fix Steps:

1. **Go to repository Settings → Security**

2. **Enable Dependabot alerts:**
   - Under "Vulnerability alerts", click **Enable**
   - This detects known vulnerabilities in dependencies

3. **Enable Dependabot security updates:**
   - Under "Dependabot security updates", click **Enable**
   - This automatically creates PRs to fix vulnerabilities

4. **Enable Secret scanning (if private repo):**
   - Under "Secret scanning", click **Enable**
   - This prevents API keys and tokens from being committed

5. **Enable Code scanning (optional but recommended):**
   - Under "Code security and analysis", click **Set up** for CodeQL
   - Choose default workflow and commit

### For Organization-wide Setup:

1. Go to your GitHub Organization **Settings**
2. Click **Code security and analysis**
3. Enable features for all repositories:
   - Dependabot alerts
   - Dependabot security updates
   - Secret scanning (for private repos)

### Verification:

After enabling these features, re-run compliance scan. Controls **CC7.2.1** and **CC7.2.2** should improve from WARNING → PASS.

---

## 4. Quick Verification Checklist

After making changes, verify your setup:

```bash
# Check branch protection
gh api repos/:owner/:repo/branches/main/protection

# Check if commits are signed
git log --show-signature -1

# Check security features
gh api repos/:owner/:repo | jq '.security_and_analysis'
```

Or manually:
- ✅ Try to push directly to main (should be blocked)
- ✅ Create a commit - look for "Verified" badge on GitHub
- ✅ Check repository **Security** tab for alerts

---

## 5. Re-run Compliance Scan

After fixing the above:

1. Go to Kushim **Dashboard**
2. Click **Run Compliance Scan**
3. Wait 10-15 seconds
4. Check compliance score - should improve

**Expected outcome:**
- Branch Protection: FAIL → PASS (immediately)
- Commit Signing: WARNING → PASS (after 20+ signed commits)
- Repository Security: WARNING → PASS (immediately)

---

## 6. Troubleshooting

### Branch Protection shows FAIL despite configuration:
- Ensure the rule applies to the exact branch name (main vs master)
- Check "Include administrators" is enabled
- Verify at least 1 approval is required

### Commits not showing as verified:
- Check GPG/SSH key is added to GitHub account
- Verify Git config: `git config --global commit.gpgsign`
- Test: `git commit --allow-empty -m "Test signed commit" -S`

### Security features not detected:
- Wait 5 minutes after enabling (GitHub API caching)
- Ensure you have admin access to the repository
- Check organization security policies aren't overriding

---

## 7. Compliance Impact

### Current (Before Fixes):
- 0 PASS / 5 Total = **0% compliance**

### After Branch Protection Fix:
- 1 PASS / 5 Total = **20% compliance**

### After All Fixes:
- 5 PASS / 5 Total = **100% compliance** for GitHub controls
- Overall: ~7.8% of total SOC 2 controls (5/64)

---

## Additional Resources

- [GitHub Branch Protection Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [GitHub Commit Signing Docs](https://docs.github.com/en/authentication/managing-commit-signature-verification)
- [GitHub Security Features](https://docs.github.com/en/code-security)

---

**Need help?** Check the [Dashboard](../apps/web/app/dashboard) for specific control details and remediation steps.
