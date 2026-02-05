# Getting Started with Kushim

Welcome to Kushim - the automated SOC 2 compliance platform! This guide will help you get up and running in under 30 minutes.

---

## Table of Contents

1. [What is Kushim?](#what-is-kushim)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Creating Your Account](#creating-your-account)
5. [Connecting Your First Integration](#connecting-your-first-integration)
6. [Understanding the Dashboard](#understanding-the-dashboard)
7. [Running Your First Compliance Check](#running-your-first-compliance-check)
8. [Next Steps](#next-steps)

---

## What is Kushim?

Kushim automates SOC 2 compliance monitoring by:

- **Collecting evidence** from your infrastructure (AWS, GitHub, Okta)
- **Running compliance checks** against SOC 2 Trust Service Criteria
- **Creating remediation tickets** in Jira when controls fail
- **Sending real-time alerts** to Slack for critical issues
- **Storing immutable evidence** for auditors

### Key Benefits

✅ **Save 100+ hours** per SOC 2 audit cycle
✅ **Continuous compliance** monitoring (not just annual)
✅ **Automatic remediation** tracking via Jira
✅ **Auditor-ready evidence** with full audit trail
✅ **Real-time visibility** into compliance posture

---

## Prerequisites

Before you begin, ensure you have:

- [ ] Access to AWS account (with IAM permissions)
- [ ] GitHub organization or personal account
- [ ] Okta account (trial or production)
- [ ] Jira Cloud or Server instance
- [ ] Slack workspace (optional but recommended)
- [ ] Node.js 20+ and Docker installed (for self-hosted)

**Estimated Setup Time**: 30 minutes

---

## Installation

Kushim can be deployed in three ways:

### Option 1: Cloud Hosted (Fastest)

Sign up at [app.kushim.io](https://app.kushim.io) - no installation required!

### Option 2: Docker Compose (Recommended for Self-Hosted)

```bash
# Clone repository
git clone https://github.com/your-org/kushim-web.git
cd kushim-web

# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env

# Start all services
docker-compose up -d

# Access:
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

### Option 3: Manual Setup (Development)

```bash
# Install dependencies
npm install

# Setup database
docker-compose up postgres redis -d
cd apps/backend
npm run prisma:generate
npm run migrate
npm run seed

# Start development servers
npm run dev
```

**Verify Installation**:

```bash
# Check services are running
docker-compose ps

# Expected output:
# kushim-backend    running    0.0.0.0:3001->3001/tcp
# kushim-web        running    0.0.0.0:3000->3000/tcp
# kushim-postgres   running    5432/tcp
# kushim-redis      running    6379/tcp
```

---

## Creating Your Account

### Step 1: Access Kushim

Navigate to your Kushim instance:
- Cloud: https://app.kushim.io
- Self-hosted: http://localhost:3000

### Step 2: Sign Up

```
┌─────────────────────────────────────────┐
│  Welcome to Kushim                      │
│  Automated SOC 2 Compliance             │
├─────────────────────────────────────────┤
│  Create Account                         │
│                                         │
│  Organization Name: [Acme Corp      ]  │
│  Your Name:        [John Smith     ]   │
│  Email:            [john@acme.com  ]   │
│  Password:         [••••••••••••••]    │
│                                         │
│  [Create Account]                       │
│                                         │
│  Already have an account? Sign in       │
└─────────────────────────────────────────┘
```

### Step 3: Verify Email

```
📧 Check your email for verification link

Subject: Verify your Kushim account
From: noreply@kushim.io

Hi John,

Welcome to Kushim! Click below to verify your email:

[Verify Email Address]

This link expires in 24 hours.
```

### Step 4: Complete Setup Wizard

After verification, you'll be guided through initial setup:

```
┌─────────────────────────────────────────┐
│  Setup Wizard (Step 1 of 3)             │
├─────────────────────────────────────────┤
│  Tell us about your organization        │
│                                         │
│  Industry:    [Technology ▼]            │
│  Company Size: [11-50 employees ▼]      │
│  SOC 2 Status:                          │
│    ⚫ Planning to get SOC 2             │
│    ⚪ Currently in audit                │
│    ⚪ Already SOC 2 certified           │
│                                         │
│  [Skip] [Next →]                        │
└─────────────────────────────────────────┘
```

---

## Connecting Your First Integration

We recommend starting with **GitHub** as your first integration - it's the easiest to set up and provides immediate value.

### Quick Start: GitHub Integration

#### 1. Navigate to Integrations

```
Dashboard → Settings → Integrations
```

#### 2. Connect GitHub

```
┌─────────────────────────────────────────┐
│  GitHub Integration                     │
├─────────────────────────────────────────┤
│  Status: Not Connected                  │
│                                         │
│  Monitors:                              │
│  • Branch protection rules              │
│  • Code review requirements             │
│  • Commit signing                       │
│  • Security scanning                    │
│                                         │
│  [Connect GitHub]                       │
└─────────────────────────────────────────┘
```

Click **Connect GitHub** and follow the [GitHub Integration Guide](../setup/github-integration.md).

#### 3. Select Repositories

After connecting, select repositories to monitor:

```
Select Repositories to Monitor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Search: [api-backend]

☑ acme-corp/api-backend (Main application)
☑ acme-corp/web-frontend (Customer portal)
☐ acme-corp/mobile-app (iOS/Android app)
☐ acme-corp/internal-tools (Internal use)
☐ acme-corp/docs (Documentation)

[Select All] [Select None]

[Cancel] [Save Selection →]
```

#### 4. Run Initial Check

```
Running GitHub Compliance Checks...

⏳ Checking branch protection (5 repos)...
⏳ Verifying code review requirements...
⏳ Checking commit signing...

✅ Complete! (15 seconds)

Results:
  Branch Protection: ⚠️ 60% compliant (3/5 repos)
  Code Reviews: ✅ 100% compliant
  Commit Signing: ❌ 0% enabled
```

### Recommended Integration Order

For best results, connect integrations in this order:

1. **GitHub** (5 min) - Code security controls
2. **AWS** (10 min) - Infrastructure compliance
3. **Okta** (10 min) - User access management
4. **Jira** (5 min) - Automatic remediation tracking
5. **Slack** (5 min) - Real-time alerts

**Total time**: ~35 minutes for full setup

---

## Understanding the Dashboard

### Home Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  Compliance Overview                    As of Jan 15, 2024  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Overall Compliance Score:  87.5%  ⚠️ Needs Attention      │
│                                                             │
│  ████████████████░░░░░░░░░░  87.5%                         │
│                                                             │
│  By Framework:                                              │
│    SOC 2 Type I:   ████████████████░░░░  82%              │
│    SOC 2 Type II:  ███████████████████░  92%              │
│                                                             │
│  Trust Service Criteria:                                    │
│    CC6 - Logical Access       ⚠️ 75%   (3 controls failing)│
│    CC7 - System Operations    ✅ 95%   (All passing)       │
│    CC8 - Change Management    ✅ 100%  (All passing)       │
│                                                             │
│  [View Detailed Report]  [Run Compliance Check]            │
└─────────────────────────────────────────────────────────────┘
```

### Controls View

```
┌─────────────────────────────────────────────────────────────┐
│  Compliance Controls                      Filters: All ▼    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ❌ AWS_IAM_MFA - IAM MFA Enforcement                       │
│     12 out of 150 users (8%) do not have MFA enabled       │
│     SOC 2: CC6.1 | Severity: Critical                      │
│     Last Check: 2 hours ago                                 │
│     [View Evidence]  [Remediate]                            │
│                                                             │
│  ⚠️  GITHUB_BRANCH_PROTECTION - Branch Protection Rules    │
│     2 out of 5 repos (40%) lack branch protection          │
│     SOC 2: CC8.1 | Severity: High                          │
│     Last Check: 2 hours ago                                 │
│     [View Evidence]  [Remediate]                            │
│                                                             │
│  ✅ OKTA_MFA - Okta MFA Enforcement                        │
│     132 out of 132 users (100%) have MFA enabled           │
│     SOC 2: CC6.1 | Severity: N/A                           │
│     Last Check: 2 hours ago                                 │
│     [View Evidence]                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Evidence Library

```
┌─────────────────────────────────────────────────────────────┐
│  Evidence Library                         Search: MFA       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ev_abc123def456 | AWS IAM MFA Check                       │
│    Collected: Jan 15, 2024 14:30:00 UTC                    │
│    Control: AWS_IAM_MFA                                     │
│    Status: FAIL                                             │
│    Hash: sha256:a1b2c3...                                   │
│    [Download JSON]  [View Details]                          │
│                                                             │
│  ev_def789ghi012 | Okta MFA Status                         │
│    Collected: Jan 15, 2024 14:30:15 UTC                    │
│    Control: OKTA_MFA                                        │
│    Status: PASS                                             │
│    Hash: sha256:d4e5f6...                                   │
│    [Download JSON]  [View Details]                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Integration Health

```
┌─────────────────────────────────────────────────────────────┐
│  Integration Health                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ AWS           Connected    Last sync: 2 hours ago      │
│  ✅ GitHub        Connected    Last sync: 2 hours ago      │
│  ✅ Okta          Connected    Last sync: 2 hours ago      │
│  ✅ Jira          Connected    Tickets created: 3          │
│  ✅ Slack         Connected    Alerts sent: 12             │
│                                                             │
│  [Configure Integrations]                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Running Your First Compliance Check

### Manual Check

#### From Dashboard

1. Click **Run Compliance Check** button
2. Select scope:

```
┌─────────────────────────────────────────┐
│  Run Compliance Check                   │
├─────────────────────────────────────────┤
│  Scope:                                 │
│    ⚫ All controls (recommended)        │
│    ⚪ Specific framework (SOC 2)        │
│    ⚪ Specific criteria (CC6, CC7...)   │
│    ⚪ Specific integrations             │
│                                         │
│  Options:                               │
│    ☑ Create Jira tickets for failures  │
│    ☑ Send Slack alerts                 │
│    ☐ Generate PDF report               │
│                                         │
│  [Cancel]  [Run Check]                  │
└─────────────────────────────────────────┘
```

3. Monitor progress:

```
Running Compliance Checks...

✅ AWS IAM MFA (1/15)
✅ AWS S3 Encryption (2/15)
✅ AWS CloudTrail Logging (3/15)
⏳ GitHub Branch Protection (4/15)...

Progress: ████████░░░░░░░░  40% (6/15)

[Cancel Check]
```

4. Review results:

```
Compliance Check Complete!

Duration: 47 seconds
Controls Checked: 15
Status:
  ✅ Passing: 12
  ⚠️  Warning: 1
  ❌ Failing: 2

Critical Issues:
  • [AWS_IAM_MFA] 12 users without MFA
  • [GITHUB_BRANCH] 2 repos without protection

Actions Taken:
  🎫 Created 2 Jira tickets
  💬 Sent 3 Slack alerts

[View Detailed Report]  [Export Evidence]
```

### Scheduled Checks

Configure automatic compliance checks:

```
Settings → Compliance Checks → Schedule

┌─────────────────────────────────────────┐
│  Compliance Check Schedule              │
├─────────────────────────────────────────┤
│  Frequency:                             │
│    ⚫ Daily at 02:00 AM UTC             │
│    ⚪ Every 6 hours                     │
│    ⚪ Weekly (Monday 08:00 AM)          │
│    ⚪ Manual only                       │
│                                         │
│  Scope:                                 │
│    ☑ All integrations                  │
│                                         │
│  Actions:                               │
│    ☑ Auto-create Jira tickets          │
│    ☑ Send Slack daily summary          │
│    ☑ Generate audit report             │
│                                         │
│  [Save Schedule]                        │
└─────────────────────────────────────────┘
```

---

## Next Steps

### 1. Connect Remaining Integrations

- [ ] [AWS Integration](../setup/aws-integration.md) - Infrastructure compliance
- [ ] [Okta Integration](../setup/okta-integration.md) - User access management
- [ ] [Jira Integration](../setup/jira-integration.md) - Remediation tracking
- [ ] [Slack Integration](../setup/slack-integration.md) - Real-time alerts

### 2. Configure Compliance Frameworks

Enable additional frameworks beyond SOC 2:

```
Settings → Frameworks

Available Frameworks:
  ✅ SOC 2 Type I (enabled)
  ☐ SOC 2 Type II
  ☐ ISO 27001 (coming soon)
  ☐ HIPAA (coming soon)
  ☐ PCI DSS (coming soon)
```

### 3. Customize Controls

Adjust control thresholds for your organization:

```
Settings → Controls → AWS_IAM_MFA

┌─────────────────────────────────────────┐
│  AWS IAM MFA Enforcement                │
├─────────────────────────────────────────┤
│  Threshold:                             │
│    Minimum MFA enrollment: [95 %]      │
│                                         │
│  Severity if failing:                   │
│    [Critical ▼]                         │
│                                         │
│  Remediation:                           │
│    ☑ Auto-create Jira ticket           │
│    ☑ Assign to: [Security Team ▼]      │
│    Due date: [7 days ▼]                │
│                                         │
│  [Save Changes]                         │
└─────────────────────────────────────────┘
```

### 4. Invite Team Members

```
Settings → Team → Invite Members

┌─────────────────────────────────────────┐
│  Invite Team Members                    │
├─────────────────────────────────────────┤
│  Email:           [alice@acme.com   ]  │
│  Role:            [Compliance Admin ▼]  │
│                                         │
│  Roles:                                 │
│    • Owner - Full access                │
│    • Compliance Admin - Manage controls │
│    • Security Admin - View only         │
│    • Auditor - Read-only access         │
│                                         │
│  [Send Invitation]                      │
└─────────────────────────────────────────┘
```

### 5. Prepare for Audit

When ready for SOC 2 audit:

1. **Generate Compliance Report**:
   ```
   Reports → SOC 2 Audit Report → Generate
   ```

2. **Export Evidence**:
   ```
   Evidence Library → Export All → [Select Date Range]
   Format: [ZIP Archive ▼] (includes JSON + PDF)
   [Download Evidence Package]
   ```

3. **Share with Auditor**:
   ```
   Settings → Auditor Access → Invite Auditor
   
   Email: auditor@cpa-firm.com
   Access Level: [Read-only ▼]
   Evidence Access: [Full ▼]
   Expiration: [90 days ▼]
   
   [Send Invitation]
   ```

### 6. Set Up Continuous Monitoring

- ✅ Daily compliance checks (already scheduled)
- ✅ Slack alerts for failures
- ✅ Weekly compliance summary email
- ✅ Monthly executive report

---

## Common First-Time Tasks

### Fix Your First Compliance Failure

Let's remediate the GitHub branch protection issue:

#### Step 1: View Evidence

```
Controls → GITHUB_BRANCH_PROTECTION → View Evidence

Evidence Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Repository: acme-corp/api-backend
Branch: main
Protected: ❌ No

Required Settings:
  ☐ Require pull request reviews (minimum 1)
  ☐ Require status checks to pass
  ☐ Require branches to be up to date
  ☐ Include administrators
```

#### Step 2: Remediate in GitHub

1. Go to repository: `github.com/acme-corp/api-backend`
2. Settings → Branches
3. Click **Add rule** for `main` branch
4. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1)
   - ✅ Require status checks to pass before merging
5. Save changes

#### Step 3: Verify Fix

```
Controls → GITHUB_BRANCH_PROTECTION → Re-run Check

⏳ Checking branch protection...

✅ Check Passed!

Repository: acme-corp/api-backend
Branch: main
Protected: ✅ Yes

Settings Met:
  ✅ Pull request reviews required (minimum 1)
  ✅ Status checks required
  ✅ Branches must be up to date
  ✅ Administrators included
```

### Generate Your First Report

```
Reports → New Report

Report Type: [Compliance Summary ▼]
Date Range: [Last 30 days ▼]
Format: [PDF ▼]

Include:
  ☑ Executive summary
  ☑ Control status breakdown
  ☑ Evidence summary
  ☑ Remediation progress
  ☐ Detailed evidence logs (auditor only)

[Generate Report]
```

---

## Getting Help

### Documentation

- 📚 [Integration Setup Guides](../setup/)
- 🔧 [Troubleshooting Guide](../troubleshooting/common-issues.md)
- 📖 [SOC 2 Control Reference](../reference/soc2-controls.md)

### Support Channels

- 📧 **Email**: support@kushim.io (Response: <24h)
- 💬 **Slack Community**: [kushim-community.slack.com](https://kushim-community.slack.com)
- 📞 **Enterprise Support**: support.kushim.io/enterprise (Response: <4h)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/kushim/kushim/issues)

### Training Resources

- 🎥 [Video Tutorials](https://kushim.io/tutorials)
- 📺 [Live Onboarding Sessions](https://kushim.io/onboarding) (Tuesdays 2 PM ET)
- 📄 [Best Practices Guide](https://docs.kushim.io/best-practices)

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│  Kushim Quick Reference                                     │
├─────────────────────────────────────────────────────────────┤
│  Run Compliance Check:     Dashboard → Run Check            │
│  View Evidence:            Evidence Library → Search        │
│  Create Report:            Reports → New Report             │
│  Add Integration:          Settings → Integrations → Add    │
│  Invite Team Member:       Settings → Team → Invite         │
│  Configure Alerts:         Settings → Alerts                │
│  Export Evidence:          Evidence Library → Export All    │
│  View Audit Trail:         Settings → Audit Log             │
├─────────────────────────────────────────────────────────────┤
│  Keyboard Shortcuts:                                        │
│    Ctrl/Cmd + K            Command palette                  │
│    Ctrl/Cmd + R            Run compliance check             │
│    Ctrl/Cmd + E            Export evidence                  │
│    Ctrl/Cmd + /            Search                           │
└─────────────────────────────────────────────────────────────┘
```

---

**Congratulations!** 🎉 You're now ready to automate your SOC 2 compliance with Kushim!

Questions? Reach out to support@kushim.io or join our [Slack Community](https://kushim-community.slack.com).
