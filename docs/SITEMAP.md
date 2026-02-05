# Kushim Platform - Sitemap & Navigation

```
┌─────────────────────────────────────────────────────────────┐
│                    KUSHIM PLATFORM                          │
│               Compliance Automation with AI                 │
└─────────────────────────────────────────────────────────────┘

PUBLIC PAGES (Not Logged In)
├─ / (Landing Page)
│  ├─ Features
│  ├─ Pricing
│  ├─ About
│  └─ Contact
│
├─ /login
├─ /register
└─ /forgot-password

AUTHENTICATED PAGES (Logged In)
├─ /dashboard (Main Hub)
│  ├─ Compliance Score Widget
│  ├─ Framework Selector (SOC2, ISO27001, HIPAA, PCI DSS)
│  ├─ Integration Health
│  ├─ Control Status Chart
│  ├─ Recent Alerts
│  └─ AI Insights Banner
│
├─ /integrations
│  ├─ AWS Integration Card
│  ├─ GitHub Integration Card
│  ├─ Okta Integration Card
│  ├─ Jira Integration Card
│  └─ Slack Integration Card
│
├─ /controls
│  ├─ Framework Tabs (SOC2, ISO27001, HIPAA, PCI DSS)
│  ├─ Control List (filtered by category)
│  │  ├─ Control Details Modal
│  │  ├─ Evidence Viewer
│  │  └─ AI Mapping Dialog
│  └─ Cross-Framework Mapping View
│
├─ /evidence
│  ├─ Evidence List (filterable by source/type)
│  ├─ Evidence Details Panel
│  │  ├─ Raw Data Viewer (JSON)
│  │  ├─ Mapped Controls
│  │  ├─ AI Confidence Score
│  │  └─ Manual Override Form
│  └─ Evidence Timeline
│
├─ /reports
│  ├─ Report Generator
│  │  ├─ Compliance Status Report
│  │  ├─ Evidence Collection Report
│  │  ├─ Control Effectiveness Report
│  │  └─ Audit Readiness Report
│  │
│  └─ Policies (AI-Generated)
│     ├─ Policy List
│     ├─ Policy Details
│     │  ├─ Version History
│     │  ├─ Approval Workflow
│     │  └─ Export Options (PDF/DOCX/MD)
│     └─ Generate New Policy Dialog
│
├─ /settings
│  ├─ Profile
│  │  ├─ Personal Info
│  │  ├─ Change Password
│  │  └─ Two-Factor Auth
│  │
│  ├─ Company
│  │  ├─ Company Details
│  │  ├─ Active Frameworks
│  │  └─ Target Dates
│  │
│  ├─ Team
│  │  ├─ User List
│  │  ├─ Invite Users
│  │  ├─ Role Management
│  │  └─ Active Sessions
│  │
│  ├─ Notifications
│  │  ├─ Email Preferences
│  │  ├─ Slack Settings
│  │  └─ Alert Frequency
│  │
│  └─ API & Integrations
│     ├─ API Keys
│     ├─ Webhooks
│     └─ Usage Stats
│
└─ /ai (AI Features - Accessible via overlays/modals)
   ├─ Evidence Mapping AI
   │  └─ Auto-map Dialog
   │
   ├─ Policy Drafting AI
   │  ├─ Template Selector (33+ templates)
   │  ├─ Generation Form
   │  ├─ Preview Panel
   │  ├─ AI Review
   │  └─ Export Options
   │
   └─ Compliance Copilot (Chat Sidebar)
      ├─ Conversation History
      ├─ Smart Suggestions
      ├─ Citations Panel
      └─ Quick Actions

API ENDPOINTS (Backend)
├─ /api/auth/*
├─ /api/users/*
├─ /api/integrations/*
├─ /api/controls/*
├─ /api/evidence/*
├─ /api/policies/*
├─ /api/frameworks/*
├─ /api/copilot/*
├─ /api/ai/orchestrator/*
├─ /api/ai/analytics/*
└─ /api/health
```

## Navigation Menu Structure

**Top Navigation (Always Visible):**
```
┌─────────────────────────────────────────────────────┐
│ [Logo] Dashboard Integrations Controls Evidence    │
│                                Reports    [👤 User] │
└─────────────────────────────────────────────────────┘
```

**User Dropdown Menu:**
```
👤 John Doe (Admin)
├─ Profile
├─ Settings
├─ Team
├─ Help & Documentation
├─ API Documentation
└─ Logout
```

**AI Features Access:**
```
Fixed Position (Right Side):
┌─────────────┐
│ 💬 Copilot  │  ← Click to open chat
├─────────────┤
│ ✨ AI Tools │  ← Dropdown:
│             │    - Evidence Mapping
│             │    - Policy Drafting
│             │    - Smart Suggestions
└─────────────┘
```

## Mobile Navigation

**Hamburger Menu (Mobile):**
```
☰
├─ Dashboard
├─ Integrations
├─ Controls
├─ Evidence
├─ Reports
├─ Settings
├─ AI Copilot
└─ Logout
```

## Quick Actions (Context-Aware)

**Dashboard:**
- "Connect Integration" → /integrations
- "View Failed Controls" → /controls?status=failed
- "Generate Policy" → /reports/policies/new
- "Ask Copilot" → Opens Copilot sidebar

**Controls Page:**
- "Filter by Framework" → Framework selector
- "AI Map Evidence" → Evidence mapping dialog
- "Export Report" → Report generator

**Evidence Page:**
- "Auto-map All" → Batch AI mapping
- "Filter by Source" → Source filter
- "Export Evidence" → CSV/JSON export

**Integrations Page:**
- "Connect AWS" → OAuth flow
- "Sync Now" → Manual sync trigger
- "View Logs" → Integration logs

## Keyboard Shortcuts

```
Global:
  /        - Open Copilot
  Ctrl+K   - Quick search
  Esc      - Close modal/dialog

Navigation:
  g d      - Go to Dashboard
  g i      - Go to Integrations
  g c      - Go to Controls
  g e      - Go to Evidence
  g r      - Go to Reports

Actions:
  n        - New item (context-aware)
  s        - Search current page
  ?        - Show keyboard shortcuts
```

## Page Loading States

```
Initial Load:
┌────────────────────┐
│                    │
│   ⟳ Loading...     │  ← Spinner with message
│                    │
└────────────────────┘

Data Loading:
┌────────────────────┐
│ ▓▓▓▓░░░░░░ 40%     │  ← Progress bar
│ Loading controls   │
└────────────────────┘

Error State:
┌────────────────────┐
│   ⚠️ Error          │
│ Failed to load     │
│ [Retry] [Cancel]   │
└────────────────────┘
```

## Breadcrumb Navigation

```
Home > Integrations > AWS > IAM Roles
[←]   [Integration]   [AWS]   [Details]

Home > Reports > Policies > Information Security Policy > Version 2
[←]   [Reports]   [Policies]   [Policy]   [Version]
```

## URL Structure

```
Public:
  /                      → Landing page
  /login                 → Login page
  /register              → Registration
  /forgot-password       → Password reset

Authenticated:
  /dashboard             → Main dashboard
  
  /integrations          → List all integrations
  /integrations/aws      → AWS integration details
  
  /controls              → List controls (default SOC2)
  /controls?framework=iso27001  → ISO27001 controls
  /controls/:id          → Control details
  
  /evidence              → List evidence
  /evidence/:id          → Evidence details
  
  /reports               → Reports dashboard
  /reports/generate      → Report generator
  /reports/policies      → Policies list
  /reports/policies/:id  → Policy details
  
  /settings              → Settings dashboard
  /settings/profile      → Profile settings
  /settings/team         → Team management
```

## Deep Links (Shareable URLs)

```
Share a Control:
  /controls/cc6-1        → Direct link to CC6.1

Share Evidence:
  /evidence/aws-iam-123  → Specific evidence item

Share Policy:
  /reports/policies/info-sec-policy  → Policy document

Share Report:
  /reports/audit-readiness-2024-q1   → Generated report
```

---

**Last Updated:** Phase 3 Week 9  
**Total Pages:** 20+  
**Total API Endpoints:** 75+
