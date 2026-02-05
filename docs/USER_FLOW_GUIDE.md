# Kushim Platform - Complete User Flow Guide

## 🎯 What You Should See

### 1. **Landing Page** (`/`)
**URL:** http://localhost:3000

**What you see:**
- Hero section with platform overview
- "Automate SOC 2 Compliance with AI"
- Key features: Evidence Mapping, Policy Generation, Compliance Copilot
- Call-to-action buttons: "Get Started" / "View Demo"
- Pricing tiers
- Feature comparison

**Actions:**
- Click "Get Started" → Goes to `/register`
- Click "Login" → Goes to `/login`

---

### 2. **Registration Page** (`/register`)
**URL:** http://localhost:3000/register

**What you see:**
- Registration form with fields:
  - First Name
  - Last Name
  - Email
  - Password (with strength indicator)
  - Company Name
  - Agree to Terms checkbox
- "Already have an account? Login" link

**User Flow:**
1. Fill in registration details
2. Submit form
3. Backend sends verification email
4. User sees: "Check your email for verification link"
5. Click verification link in email
6. Redirected to `/login` with success message

---

### 3. **Login Page** (`/login`)
**URL:** http://localhost:3000/login

**What you see:**
- Login form:
  - Email
  - Password
  - "Remember me" checkbox
- "Forgot password?" link
- "Don't have an account? Register" link

**User Flow:**
1. Enter email + password
2. Submit
3. Backend validates and returns JWT token
4. Redirected to `/dashboard`

**Forgot Password Flow:**
1. Click "Forgot password?"
2. Goes to `/forgot-password`
3. Enter email
4. Backend sends reset link
5. Click link in email
6. Reset password
7. Login again

---

### 4. **Dashboard** (`/dashboard`)
**URL:** http://localhost:3000/dashboard

**What you see:**
- **Top Navigation:**
  - Logo
  - Dashboard, Integrations, Controls, Evidence, Reports
  - User menu (Profile, Settings, Logout)

- **Main Dashboard Widgets:**
  - **Compliance Score Card:** Overall compliance percentage (e.g., 78%)
  - **Framework Selector:** SOC 2, ISO 27001, HIPAA, PCI DSS
  - **Integration Health:** Status of 5 integrations (AWS, GitHub, Okta, Jira, Slack)
  - **Control Status:** Pass/Fail/Pending breakdown
  - **Recent Alerts:** Latest compliance issues
  - **AI Insights Banner:** Smart suggestions from Copilot

**Actions:**
- View compliance score trends
- Switch between frameworks
- Click "View Details" on any widget
- Access AI features from top bar

---

### 5. **Integrations Page** (`/integrations`)
**URL:** http://localhost:3000/integrations

**What you see:**
- **Integration Cards** for each service:

**AWS Integration:**
- Status: Connected / Not Connected
- "Connect AWS" button
- Shows: IAM roles, CloudTrail logs, Config rules
- Last sync time

**GitHub Integration:**
- Status badge
- "Connect GitHub" button (OAuth flow)
- Shows: Repositories, commit signing, branch protection
- Last evidence collection time

**Okta Integration:**
- Status indicator
- "Connect Okta" button
- Shows: Users, MFA enforcement, session policies
- Sync status

**Jira Integration:**
- Connection status
- "Connect Jira" button
- Shows: Auto-created tickets for failed controls
- Ticket count

**Slack Integration:**
- Status
- "Connect Slack" button
- Shows: Alert notifications enabled
- Last alert sent

**User Flow:**
1. Click "Connect [Service]"
2. OAuth popup window opens
3. Authorize access
4. Return to integrations page
5. See "Connected" status
6. Evidence collection starts automatically

---

### 6. **Controls Page** (`/controls`)
**URL:** http://localhost:3000/controls

**What you see:**
- **Framework Tabs:** SOC 2, ISO 27001, HIPAA, PCI DSS
- **Control Categories:** CC1-CC9 for SOC 2

**For each control:**
- Control ID (e.g., CC6.1)
- Title (e.g., "Logical Access Controls")
- Status: PASS ✅ / FAIL ❌ / PENDING ⏳
- Last checked timestamp
- "View Evidence" button
- "AI Map Evidence" button (new!)

**Actions:**
- Filter by status (Pass/Fail/Pending)
- Search controls
- View mapped evidence
- Trigger AI evidence mapping
- See cross-framework mappings (if multiple frameworks active)

---

### 7. **Evidence Page** (`/evidence`)
**URL:** http://localhost:3000/evidence

**What you see:**
- **Evidence List:**
  - Source (AWS, GitHub, Okta, Jira, Slack)
  - Type (IAM Role, Commit, User, Ticket, Message)
  - Collection date
  - Mapped controls count
  - AI confidence score (0-100%)

**Evidence Details:**
- Raw evidence content (JSON viewer)
- Mapped controls with reasoning
- AI-generated mapping explanation
- Manual override option

**Actions:**
- Filter by source/type
- Search evidence
- Click "Auto-map with AI" → AI suggests control mappings
- Review AI suggestions
- Approve or override mappings
- View evidence timeline

---

### 8. **AI Features**

#### **AI Evidence Mapping** (accessible from Controls or Evidence pages)
**Flow:**
1. Click "AI Map Evidence" on a control
2. AI analyzes evidence content
3. Shows suggested mappings with confidence scores
4. User reviews: "The commit enables MFA → maps to CC6.1 (95% confidence)"
5. Approve or adjust mappings
6. Evidence automatically linked to controls

#### **AI Policy Drafting** (accessible from Reports → Policies)
**Flow:**
1. Click "Generate Policy"
2. Select template (33+ options):
   - Information Security Policy
   - Access Control Policy
   - Incident Response Policy
   - Password Policy
   - etc.
3. AI generates customized policy based on:
   - Company size
   - Industry
   - Tech stack
   - Existing controls
4. Preview generated policy (Markdown)
5. AI reviews for completeness (compliance score 0-100)
6. Edit if needed
7. Approve
8. Export to PDF/DOCX/Markdown

#### **Compliance Copilot** (accessible from chat icon in top nav)
**Flow:**
1. Click chat icon → Copilot panel slides in
2. Ask natural language questions:
   - "What is CC6.1?"
   - "Show me evidence for access control"
   - "What policies do I need for SOC 2?"
   - "How is my compliance score?"
3. AI responds with context-aware answers
4. Shows citations to source documents
5. Provides actionable recommendations
6. Multi-turn conversation with memory

---

### 9. **Reports Page** (`/reports`)
**URL:** http://localhost:3000/reports

**What you see:**
- **Report Types:**
  - Compliance Status Report
  - Evidence Collection Report
  - Control Effectiveness Report
  - Audit Readiness Report

- **Generated Policies:**
  - List of AI-generated policies
  - Status: Draft, In Review, Approved
  - Version history
  - "Generate New Policy" button

**Actions:**
- Generate report for specific framework
- Download as PDF/Excel
- View policy versions
- Compare policy versions
- Export policies

---

### 10. **Settings** (`/settings`)
**URL:** http://localhost:3000/settings

**What you see:**
- **Profile Settings:**
  - Update name, email
  - Change password
  - Two-factor authentication

- **Company Settings:**
  - Company name, industry
  - Active frameworks (SOC 2, ISO 27001, HIPAA, PCI DSS)
  - Target compliance dates

- **Team Management:**
  - Invite users (Admin, User, Viewer roles)
  - Manage permissions
  - View active sessions

- **Notifications:**
  - Email alerts for failed controls
  - Slack notifications
  - Alert frequency

- **API Keys:**
  - Integration credentials
  - Webhooks
  - API usage stats

---

## 🎨 Visual Design

### Color Scheme:
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Error: Red (#EF4444)
- Background: White/Light Gray
- Dark mode support

### Components:
- shadcn/ui components (Radix UI primitives)
- Tailwind CSS utility classes
- Responsive design (mobile, tablet, desktop)
- Smooth transitions and animations

---

## 📊 Sample Data (After Setup)

### Dashboard:
- **Compliance Score:** 78% (62/80 controls passing)
- **Integrations:** 5/5 connected
- **Evidence Items:** 1,247 collected
- **Policies:** 12 generated, 8 approved
- **Recent Activity:**
  - AWS IAM role created → CC6.1 mapped
  - GitHub MFA enabled → CC6.6 mapped
  - Access Control Policy approved
  - 3 failed controls detected

### AI Insights:
- "3 controls need attention this week"
- "Evidence collection succeeded for 15 controls"
- "Recommended: Generate Incident Response Policy"

---

## 🔄 Complete User Journey

### **Day 1: Registration & Setup**
1. Visit localhost:3000
2. Register account
3. Verify email
4. Login
5. See empty dashboard with "Get Started" wizard

### **Day 1: Connect Integrations**
1. Go to /integrations
2. Connect AWS, GitHub, Okta, Jira, Slack
3. Automatic evidence collection starts
4. Return to dashboard → see compliance score updating

### **Day 2: Review Controls**
1. Go to /controls
2. See 64 SOC 2 controls
3. 30 controls automatically passing (from evidence)
4. 20 pending (need manual review)
5. 14 failing (need remediation)

### **Day 3: Use AI Features**
1. Use AI Evidence Mapping
   - Map remaining evidence to controls
   - Review AI suggestions
   - Compliance score increases to 65%

2. Use AI Policy Drafting
   - Generate 10 required policies
   - Review and approve each
   - Export to PDF for auditors

3. Use Compliance Copilot
   - Ask: "What do I need to pass SOC 2?"
   - Get personalized action plan
   - Follow recommendations

### **Week 2: Audit Preparation**
1. Compliance score: 85%
2. All policies generated and approved
3. Evidence mapped to all controls
4. Generate audit readiness report
5. Export everything for auditors
6. Pass SOC 2 audit! 🎉

---

## 🚀 Quick Start Commands

```bash
# Start everything
npm run dev

# Backend: http://localhost:3001
# Frontend: http://localhost:3000

# Default admin user (from seed):
# Email: admin@kushim.com
# Password: Admin123!

# Test the flow:
1. Open http://localhost:3000
2. Click "Login"
3. Use seed credentials
4. Explore dashboard
5. Connect integrations
6. Try AI features
```

---

## 📱 Mobile Experience

- Fully responsive design
- Touch-optimized navigation
- Simplified dashboards for mobile
- Push notifications (future)
- Mobile app (future)

---

## 🔮 What's Coming (Phase 3 - Remaining Weeks)

- **Week 10:** White-label & multi-tenancy
- **Week 11:** Continuous monitoring & custom frameworks
- **Week 12:** Advanced analytics & forecasting

---

## 💡 Pro Tips

1. **Use Keyboard Shortcuts:**
   - `/` - Open Copilot
   - `Ctrl+K` - Quick search
   - `Esc` - Close modals

2. **Bookmark Frequently Used Pages:**
   - Dashboard for daily checks
   - Evidence for reviewing new items
   - Copilot for quick questions

3. **Set Up Alerts:**
   - Slack notifications for failed controls
   - Email digest (daily/weekly)
   - Critical alerts via SMS

4. **Leverage AI:**
   - Let AI map 80% of evidence automatically
   - Generate all policies in one session
   - Ask Copilot anything you're unsure about

---

**Questions?** Ask the Compliance Copilot! 💬
