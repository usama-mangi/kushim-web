# Kushim Platform - Design System & Page Designs

## 1. Design Direction

### Aesthetic Name: **"Forensic Editorial"**

A design language that marries the precision of forensic audit documentation with the sophisticated hierarchy of editorial design. Compliance isn't about flashy dashboards—it's about irrefutable evidence, clear chains of custody, and absolute clarity under scrutiny.

### DFII Score: **13/15**

**Breakdown:**
- **Visual Impact (5/5)**: Monospace typography + asymmetric editorial layouts create instant recognition
- **Functional Enhancement (4/5)**: Data density and scannable hierarchies improve actual workflow
- **Implementation Feasibility (4/5)**: No custom illustrations needed, relies on typography & composition

### Inspiration & Conceptual Foundation

Think: **Bloomberg Terminal meets Swiss Typography meets Legal Documentation**

- **Bloomberg Terminal**: Dense information, high-contrast typography, data primacy
- **Swiss Modernism**: Grid-breaking asymmetry, generous whitespace, typographic hierarchy
- **Legal/Audit Documents**: Numbered sections, annotation systems, version control prominence
- **Forensic Reports**: Evidence tagging, timestamp emphasis, immutable records

### Differentiation Anchor

**"The platform that looks like the audit report itself."**

Users should feel like they're working inside the evidence package, not managing it from outside. Every screen should feel like a living, annotated document that an auditor would trust immediately.

**Recognition Test**: Remove the logo. You'd still know it's Kushim by:
1. Monospace headings with proportional body text
2. Left-aligned asymmetric layouts with editorial-style margins
3. Timestamped annotation panels
4. Evidence-card design with chain-of-custody styling
5. Color used as **status tags only**, never decoration

---

## 2. Design System

### Typography

#### Display Font: **JetBrains Mono** (Monospace)
**Rationale**: Technical precision, audit-trail aesthetic, stands out in B2B SaaS. Used for:
- Page headings (h1, h2)
- Data values (scores, metrics, timestamps)
- Code snippets, API keys, IDs
- Evidence tags, control IDs

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
```

#### Body Font: **IBM Plex Sans** (Proportional Sans)
**Rationale**: Professional, readable, pairs well with monospace, IBM heritage = enterprise credibility
- Body text, descriptions
- Button labels
- Form inputs
- Table content

```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap');
```

#### Typographic Scale

```css
/* Display (Monospace) */
--text-display-xl: 3.5rem / 1.1 (JetBrains Mono 600)
--text-display-lg: 2.5rem / 1.2 (JetBrains Mono 600)
--text-display-md: 2rem / 1.2 (JetBrains Mono 600)
--text-display-sm: 1.5rem / 1.3 (JetBrains Mono 500)

/* Body (Proportional) */
--text-body-xl: 1.25rem / 1.6 (IBM Plex Sans 400)
--text-body-lg: 1.125rem / 1.6 (IBM Plex Sans 400)
--text-body-base: 1rem / 1.6 (IBM Plex Sans 400)
--text-body-sm: 0.875rem / 1.5 (IBM Plex Sans 400)
--text-body-xs: 0.75rem / 1.4 (IBM Plex Sans 500)

/* Special */
--text-mono-base: 0.875rem / 1.5 (JetBrains Mono 400) // timestamps, IDs
--text-mono-sm: 0.75rem / 1.4 (JetBrains Mono 400) // evidence tags
```

---

### Color Variables

**Philosophy**: Color = Status. Never decoration.

```css
:root {
  /* Neutral Foundation (Paper + Ink) */
  --neutral-50: oklch(0.99 0 0);        /* Pure white backgrounds */
  --neutral-100: oklch(0.97 0 0);       /* Card backgrounds */
  --neutral-200: oklch(0.93 0 0);       /* Subtle borders */
  --neutral-300: oklch(0.88 0 0);       /* Dividers */
  --neutral-400: oklch(0.70 0 0);       /* Disabled text */
  --neutral-600: oklch(0.45 0 0);       /* Secondary text */
  --neutral-800: oklch(0.25 0 0);       /* Body text */
  --neutral-900: oklch(0.15 0 0);       /* Headings */
  --neutral-950: oklch(0.08 0 0);       /* Emphasis */

  /* Status Colors (High-Contrast, Audit-Safe) */
  --status-pass: oklch(0.55 0.18 145);     /* Green: Compliant */
  --status-pass-bg: oklch(0.96 0.04 145);  
  --status-pass-border: oklch(0.75 0.12 145);
  
  --status-warn: oklch(0.70 0.15 85);      /* Amber: Attention needed */
  --status-warn-bg: oklch(0.97 0.05 85);
  --status-warn-border: oklch(0.80 0.12 85);
  
  --status-fail: oklch(0.60 0.22 25);      /* Red: Non-compliant */
  --status-fail-bg: oklch(0.97 0.05 25);
  --status-fail-border: oklch(0.75 0.15 25);
  
  --status-info: oklch(0.60 0.15 240);     /* Blue: Informational */
  --status-info-bg: oklch(0.97 0.04 240);
  --status-info-border: oklch(0.75 0.10 240);

  /* Accent (Used sparingly for primary actions) */
  --accent-primary: oklch(0.20 0 0);       /* Almost black for CTAs */
  --accent-primary-hover: oklch(0.15 0 0);
  --accent-primary-fg: oklch(0.99 0 0);

  /* Evidence Highlight (for annotations, selections) */
  --highlight-yellow: oklch(0.90 0.10 90); /* Subtle highlighter effect */
  --highlight-yellow-border: oklch(0.75 0.15 90);
}

.dark {
  /* Dark Mode: Inverted paper aesthetic */
  --neutral-50: oklch(0.12 0 0);
  --neutral-100: oklch(0.16 0 0);
  --neutral-200: oklch(0.20 0 0);
  --neutral-300: oklch(0.28 0 0);
  --neutral-400: oklch(0.45 0 0);
  --neutral-600: oklch(0.65 0 0);
  --neutral-800: oklch(0.85 0 0);
  --neutral-900: oklch(0.92 0 0);
  --neutral-950: oklch(0.97 0 0);

  /* Status colors remain high-contrast */
  --status-pass: oklch(0.65 0.18 145);
  --status-warn: oklch(0.75 0.15 85);
  --status-fail: oklch(0.65 0.22 25);
  --status-info: oklch(0.65 0.15 240);
  
  --accent-primary: oklch(0.95 0 0);
  --accent-primary-hover: oklch(0.99 0 0);
  --accent-primary-fg: oklch(0.12 0 0);
}
```

---

### Spatial Composition

#### Grid System: **12-Column Editorial Grid**

Not for centering—for breaking.

```css
/* Container with editorial margins */
.container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 clamp(1.5rem, 5vw, 4rem); /* Asymmetric breathing room */
}

/* Editorial Layout Grid */
.grid-editorial {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 2rem;
}

/* Asymmetric column spanning */
.col-main {
  grid-column: 1 / 9;  /* Primary content: 8 columns */
}

.col-sidebar {
  grid-column: 9 / 13; /* Sidebar/meta: 4 columns */
}

/* Offset for visual interest */
.col-offset-1 {
  grid-column: 2 / -1;
}
```

#### Spacing Scale (8px base)

```css
--space-1: 0.5rem;   /* 8px - Tight elements */
--space-2: 0.75rem;  /* 12px - Small gaps */
--space-3: 1rem;     /* 16px - Default spacing */
--space-4: 1.5rem;   /* 24px - Section padding */
--space-6: 2rem;     /* 32px - Card spacing */
--space-8: 3rem;     /* 48px - Section margins */
--space-12: 4rem;    /* 64px - Page sections */
--space-16: 6rem;    /* 96px - Hero sections */
```

#### Breakpoints

```css
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet portrait */
--breakpoint-lg: 1024px;  /* Tablet landscape / Small desktop */
--breakpoint-xl: 1280px;  /* Desktop */
--breakpoint-2xl: 1536px; /* Wide desktop */
```

**Strategy**: Mobile-first, but prioritize **tablet-optimized workflows** (common for compliance work).

---

### Motion Philosophy

**"Instantaneous Feedback, Deliberate Transitions"**

Compliance work demands clarity, not delight. Motion should:
1. **Confirm state changes** (checkbox check, status update)
2. **Guide attention** (new evidence appearing, alert dismissal)
3. **Never distract** from critical information

#### Motion Principles

```css
/* State Changes: Instant */
--transition-instant: 100ms cubic-bezier(0.4, 0, 0.2, 1);

/* UI Interactions: Snappy */
--transition-fast: 200ms cubic-bezier(0.4, 0, 0.2, 1);

/* Panel Reveals: Deliberate */
--transition-base: 300ms cubic-bezier(0.4, 0, 0.2, 1);

/* Page Transitions: Smooth */
--transition-slow: 500ms cubic-bezier(0.4, 0, 0.1, 1);
```

#### When to Animate

✅ **Use animation for:**
- Button hover states (background shift, no scale)
- Modal/drawer entry (fade + slide from edge)
- Toast notifications (slide from top-right)
- Evidence card expansion
- Dropdown menu reveals
- Loading states (subtle pulse, no spinners)

❌ **Never animate:**
- Chart data updates (instant render)
- Table sorting/filtering
- Text changes
- Status badge updates
- Compliance scores (data integrity over polish)

---

### Texture & Depth

**"Paper, not glass."**

Avoid glossy gradients, glows, and shadows. Think printed document with subtle layering.

#### Elevation System

```css
/* Borders over shadows */
--border-subtle: 1px solid var(--neutral-200);
--border-default: 1px solid var(--neutral-300);
--border-emphasis: 2px solid var(--neutral-900);

/* Minimal shadows (used sparingly) */
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.05);
--shadow-dropdown: 0 4px 12px rgba(0, 0, 0, 0.08);
--shadow-modal: 0 8px 24px rgba(0, 0, 0, 0.12);
```

#### Surface Treatments

1. **Cards**: Subtle border + white/off-white background. NO shadows on default state.
2. **Hoverable Cards**: Add `shadow-card` on hover, shift border to `--neutral-900`
3. **Active/Selected**: Thick left border (4px) in status color
4. **Inputs**: Inset appearance via border, no background change on focus (just border color)

---

## 3. Page Designs

### Landing Page (`/`)

**Layout Philosophy**: Editorial feature article, not marketing brochure.

#### Hero Section
```
[Asymmetric Layout]

Left Column (7/12):
  - Badge: "SOC 2 Compliance Automation" (mono, small caps, outlined)
  - H1: "Audit-Ready in 90 Days" (JetBrains Mono, 3.5rem, max 8 words)
  - Subhead: 2 sentences max (IBM Plex Sans, 1.25rem, neutral-700)
  - CTA: Single primary button "Start Free Trial" (black bg, white text)
  - Meta: Small stats row (e.g., "500+ companies · SOC 2 certified · 24hr support")

Right Column (5/12):
  - Dashboard preview screenshot (bordered, subtle shadow)
  - OR: Large monospace numbers showing:
    "2,847 Controls Monitored
     347 Policies Drafted
     100% Audit Pass Rate"
```

**Design Details**:
- No gradient backgrounds
- Off-white bg (`--neutral-50`) with section dividers (`--neutral-200` 1px line)
- Typography creates all hierarchy (no icon clutter)
- CTA button uses `--accent-primary`, all other text is neutral

#### Features Section

```
[Grid: 3 columns × 2 rows, gap-8]

Each Feature Card:
  - Icon: 24×24 outline (Lucide icons), neutral-900, top-left aligned
  - Title: Mono font, 1.25rem, medium weight, 1 line
  - Description: IBM Plex Sans, 0.875rem, neutral-600, 2-3 lines max
  - NO card backgrounds—just text blocks with icon
  - Subtle left border (4px) on hover with status color
```

**Key Features to Highlight**:
1. Real-Time Compliance Monitoring (status-info)
2. AI Evidence Collection (status-pass)
3. Automated Policy Drafting (status-pass)
4. Immutable Audit Trails (status-warn)
5. Multi-Framework Support (status-info)
6. Instant Audit Reports (status-pass)

#### Integration Logos Section

```
[Centered, single row, horizontal scroll on mobile]

Background: --neutral-100 (slight tint)
Title: "Connects to Your Stack" (mono, centered)
Logos: Grayscale, 40px height, equal spacing
  AWS | GitHub | Okta | Jira | Slack | +12 more

Hover: Color fill for each logo
```

#### Pricing Section

```
[3-column grid, equal width]

Tier Cards:
  - Header: Plan name (mono, 1.5rem), Price (mono, 2.5rem)
  - Feature List: Checkmarks (status-pass icon), IBM Plex Sans 0.875rem
  - CTA Button: Outlined for non-recommended, filled for "Professional"
  
Visual Hierarchy:
  - "Professional" tier: Subtle --neutral-200 background, thicker border
  - Other tiers: White background, thin border
  - NO "Most Popular" badges (cluttered)—let price and features speak
```

**Pricing Tiers**:
- **Starter**: $499/mo · Up to 10 integrations · SOC 2 only
- **Professional**: $999/mo · Unlimited integrations · All frameworks + AI
- **Enterprise**: Custom · SSO, SAML · Dedicated support

#### Social Proof / Testimonials

```
[Optional—only if real testimonials exist]

[2-column layout, offset grid]

Quote Block:
  - Large quotation mark (mono, oversized, --neutral-300)
  - Quote text (IBM Plex Sans, 1.125rem, italic)
  - Attribution: Name + Role (mono, small caps)
  - Company logo (grayscale, 24px height)

NO star ratings, NO stock photos
```

#### Footer CTA

```
[Full-width section, --neutral-900 background, white text]

Centered:
  - H2: "Start Your 14-Day Free Trial" (mono, white)
  - Subtext: "No credit card required. Cancel anytime."
  - CTA: White button with black text
  - Small print: Privacy, Terms links
```

---

### Integration Detail Pages (`/integrations/[id]`)

**Layout Philosophy**: Evidence collection interface, not settings panel.

#### Page Structure

```
[Editorial Grid: 8-4 split]

Main Column (8/12):
  
  1. Integration Header
     - Icon + Name (AWS, GitHub, etc.) — Large, top-aligned
     - Status Badge: "Connected" (status-pass) or "Disconnected" (status-fail)
     - Last Sync: Timestamp (mono, small, --neutral-600)
     - Actions: "Sync Now" | "Disconnect" (outlined buttons)
  
  2. Activity Stream
     - Timeline-style list (left-aligned timestamps)
     - Each entry:
       [Timestamp (mono)]  [Event description]  [Evidence link →]
     - Infinite scroll or pagination
  
  3. Evidence Collection Panel
     - Title: "Recent Evidence" (mono)
     - Grid of evidence cards (2-column)
       Each card:
         - Evidence type icon (file, screenshot, API log)
         - Timestamp (mono, prominent)
         - Control ID tag (e.g., "CC-1.1")
         - Preview thumbnail (if applicable)
         - Download icon (hover action)

Sidebar (4/12):
  
  1. Configuration Panel
     - Title: "Settings" (mono)
     - Form fields: API keys, regions, filters
     - Monospace input for credentials
     - Save button (disabled until changes)
  
  2. Metrics Card
     - Title: "Performance" (mono)
     - Stats:
       • Evidence Collected: 2,847 (mono, large)
       • Controls Monitored: 34
       • Success Rate: 98.2%
     - Small sparkline chart (optional)
  
  3. Related Controls
     - List of control IDs mapped to this integration
     - Click to filter/navigate
```

**Design Details**:
- **Timestamps everywhere**: Mono font, --neutral-600, ISO 8601 format
- **Evidence cards**: Bordered, no shadow, hover adds left border (status color)
- **Activity stream**: Alternating --neutral-50 / --neutral-100 backgrounds
- **Status badges**: Pill shape, filled bg, high contrast text

---

### Enhanced Dashboard (`/dashboard`)

**Layout Philosophy**: Mission control, not vanity metrics.

#### Page Structure

```
[Fluid grid, asymmetric]

Top Bar:
  - Framework Selector: Dropdown (SOC 2, ISO 27001, etc.) — Mono font
  - Date Range Picker: Last 7 days | 30 days | Custom
  - Export Button: "Generate Report" (outlined)

Row 1: Hero Metrics (3-column grid)

  1. Compliance Score
     - Large: 94% (mono, 3rem, status color)
     - Trend: ↑ 2.3% vs last week (mono, small)
     - Progress ring (SVG, status color stroke)
  
  2. Active Alerts
     - Number: 7 (mono, 2.5rem, status-warn)
     - Breakdown: 3 High | 4 Medium
     - "View All →" link
  
  3. Evidence Collected
     - Number: 2,847 (mono, 2.5rem)
     - This month: +342
     - Small bar chart (7-day trend)

Row 2: Main Content (8-4 grid)

  Main (8/12):
    
    A. AI Insights Banner
       - Background: --highlight-yellow (subtle)
       - Icon: Sparkle (status-info)
       - Title: "3 Policy Gaps Detected" (mono, bold)
       - Description: AI found controls lacking documentation
       - CTA: "Review Suggestions →"
    
    B. Control Status Table
       - Columns: Control ID | Name | Status | Last Check | Evidence
       - Mono headings, proportional body
       - Row hover: --neutral-100 background
       - Status: Color-coded badges
       - Sortable, filterable
       - Expandable rows for details
  
  Sidebar (4/12):
    
    A. Quick Actions
       - Grid of 4 large buttons (icon + label)
         • Map Evidence
         • Draft Policy
         • Run Audit Check
         • Schedule Review
       - Each button: Bordered, no fill, hover shows status color
    
    B. Integration Health
       - List of connected integrations
       - Each: Icon | Name | Status dot | Last sync
       - Click to view detail page
    
    C. Recent Activity Feed
       - Scrollable list (max 10 items)
       - Timeline format with timestamps
       - "View All →" link

Row 3: Data Visualizations (2-column)

  1. Compliance Trend Chart
     - Line chart (7-day or 30-day)
     - X-axis: Dates (mono)
     - Y-axis: Percentage (mono)
     - Single line, status color stroke
     - Minimal grid lines
  
  2. Control Distribution
     - Horizontal bar chart
     - Categories: Pass | Warn | Fail
     - Percentages + absolute numbers (mono)
     - Status colors
```

**Design Details**:
- **Data primacy**: Metrics use largest font sizes, not hero images
- **Scannable**: High-contrast typography, clear labels, no decorative elements
- **Status colors**: Used exclusively for compliance states
- **White space**: Generous padding between sections (--space-8)

---

### Report Generator (`/reports/generate`)

**Layout Philosophy**: Multi-step wizard, document-building interface.

#### Page Structure

```
[Full-page wizard, centered column]

Header (Sticky):
  - Progress Indicator: Step 1 of 4 (mono, small)
  - Steps: [Select Type] → [Configure] → [Review] → [Export]
    Visual: Horizontal line with dots, current step highlighted

Main Area (max-width: 900px, centered):

  Step 1: Select Report Type
    - Grid of 6 report cards (2×3)
      Each card:
        • Icon (file type)
        • Title: "SOC 2 Audit Package" (mono)
        • Description: What's included (IBM Plex)
        • Select radio button (large, custom styled)
    - Next button (bottom-right, fixed)
  
  Step 2: Configure Options
    - Form layout (single column)
      • Date Range Picker
      • Framework Selector (multi-select)
      • Evidence Filters (checkboxes)
      • Custom Sections (text input for additions)
    - Preview pane (right sidebar, optional)
      Shows report outline as you configure
    - Back | Next buttons
  
  Step 3: Review & Preview
    - Split view (6-6 grid)
      Left: Report preview (scrollable, PDF-like)
      Right: Summary panel
        • Report Type
        • Date Range
        • Total Controls: 124
        • Evidence Attached: 2,847
        • File Size Estimate: 47 MB
    - Edit buttons next to each summary item
    - Back | Generate Report buttons
  
  Step 4: Export Options
    - Success state
    - Download buttons:
      • PDF (default, primary button)
      • Excel (outlined)
      • JSON (outlined)
    - Share options:
      • Copy link (for auditor access)
      • Email to auditor (form)
    - "Start New Report" link
```

**Design Details**:
- **Progress bar**: Minimal, mono numbers, connected lines
- **Report cards**: Bordered, no shadow, active state = thick border + status color
- **Preview pane**: Simulates PDF appearance (white bg, drop shadow, page breaks)
- **Buttons**: Large, high-contrast, clear hierarchy (primary vs secondary)

---

### Policy Detail Page (`/reports/policies/[id]`)

**Layout Philosophy**: Version-controlled legal document viewer.

#### Page Structure

```
[8-4 Editorial Grid]

Main Column (8/12):

  1. Document Header
     - Policy ID: "POL-IAM-001" (mono, large)
     - Title: "Identity & Access Management Policy" (mono, 1.75rem)
     - Status Badge: "Active" | "Draft" | "Archived"
     - Version: v2.3 (mono, --neutral-600)
     - Last Updated: Timestamp (mono)
     - Actions: Edit | Archive | Download (outlined buttons)
  
  2. Document Viewer
     - Styled like a legal document:
       • Numbered sections (1.0, 1.1, 1.2)
       • Mono headings for section numbers
       • IBM Plex Sans for body paragraphs
       • Indentation for subsections
       • Highlight on hover (for annotation)
     - Annotation toolbar (sticky, top):
       • Add Comment
       • Highlight Text
       • Link to Evidence
     - Inline comments appear in margin (like Google Docs)
  
  3. Linked Evidence Section
     - Title: "Supporting Evidence" (mono)
     - Grid of evidence cards (mini version)
     - Each shows: Timestamp | Control ID | File type

Sidebar (4/12):

  1. Version History Timeline
     - Vertical timeline (latest at top)
     - Each version:
       • Version number (mono, bold)
       • Author name + avatar
       • Timestamp (mono)
       • Change summary (brief text)
       • "View" link (opens comparison modal)
     - Visual connector lines between versions
  
  2. Approval Workflow
     - Title: "Approvals" (mono)
     - Status: "2 of 3 Approved"
     - List of approvers:
       • Name + Role
       • Status: Approved (status-pass) | Pending (status-warn)
       • Timestamp (if approved)
     - "Request Approval" button (if author)
  
  3. Metadata Panel
     - Framework: SOC 2 (CC1.1, CC1.2)
     - Owner: John Doe
     - Next Review Date: 2025-03-15
     - Tags: IAM, Access Control
     - Related Policies: Links to 3 other policies
```

**Design Details**:
- **Document styling**: Clean, readable, official-document aesthetic
- **Annotations**: Yellow highlight (--highlight-yellow), numbered markers
- **Version timeline**: Clear visual progression, timestamps prominent
- **Approval indicators**: Color-coded badges, clear status
- **Sticky toolbar**: Floats on scroll for easy commenting

---

### Enhanced Settings (`/settings`)

**Layout Philosophy**: Tabbed preferences, form-focused.

#### Page Structure

```
[Tabbed Interface]

Tab Bar (Sticky Top):
  - Tabs: Profile | Company | Team | Notifications | API | Billing
  - Active tab: Thick bottom border (--accent-primary)
  - Mono font, all caps

Tab Content (max-width: 1200px, centered):

--- Tab: Profile ---

  [Single column form, left-aligned]
  
  Section 1: Personal Information
    - Avatar upload (circular, 80px)
    - Name (text input)
    - Email (disabled, for display)
    - Role (display only)
  
  Section 2: Password
    - Current Password (password input)
    - New Password (password input)
    - Confirm Password (password input)
    - Change Password button (disabled until valid)
  
  Section 3: Preferences
    - Timezone (dropdown)
    - Date Format (radio buttons)
    - Language (dropdown)

--- Tab: Company ---

  [Form + Info Card side-by-side]
  
  Left (8/12):
    - Company Name (text input)
    - Industry (dropdown)
    - Company Size (dropdown)
    - Website (text input)
    - Logo Upload (bordered dropzone)
  
  Right (4/12):
    - Subscription Card
      • Plan: Professional (mono, large)
      • Status: Active (status-pass)
      • Next Billing: 2025-02-01
      • "Manage Plan" button

--- Tab: Team ---

  [Table + Invite Form]
  
  Invite Form (top, full-width):
    - Email input + Role dropdown + "Send Invite" button
    - Inline, single row
  
  Team Table:
    - Columns: Name | Email | Role | Status | Last Active | Actions
    - Actions: Edit role | Remove (icon buttons)
    - Row hover: --neutral-100 background
    - Sortable by Name, Role, Last Active
  
  Roles explanation (sidebar):
    - Admin: Full access
    - Editor: Can edit policies
    - Viewer: Read-only

--- Tab: Notifications ---

  [Toggle list, grouped by category]
  
  Category: Email Notifications
    - Compliance Alerts (toggle)
    - Weekly Summary (toggle)
    - Policy Reviews (toggle)
  
  Category: Slack Notifications
    - Failed Controls (toggle)
    - New Evidence (toggle)
    - Integration Errors (toggle)
  
  Category: In-App Notifications
    - All (toggle)
  
  Each toggle: Custom styled switch (--accent-primary when on)

--- Tab: API ---

  [Code-focused layout]
  
  API Keys Section:
    - Title: "API Keys" (mono)
    - Table:
      • Key Name | Key Preview (mono, truncated) | Created | Last Used | Actions
      • Actions: Copy | Revoke (icon buttons)
    - "Generate New Key" button
  
  Documentation Links:
    - Bordered panel with links:
      • API Reference
      • Authentication Guide
      • Rate Limits
      • Webhooks
  
  Webhooks Section:
    - List of configured webhooks
    - Each: URL (mono) | Events | Status
    - "Add Webhook" button

--- Tab: Billing ---

  [Invoice table + Payment method]
  
  Payment Method (top):
    - Card display: •••• 4242 | Exp: 12/25
    - "Update Payment" button
  
  Invoice History:
    - Table: Date | Amount | Status | Download
    - Download as PDF link
    - Pagination if >10 invoices
```

**Design Details**:
- **Forms**: Single column, left-aligned labels, full-width inputs
- **Inputs**: Bordered (--neutral-300), no fill, focus adds --accent-primary border
- **Toggles**: Custom styled (not default checkbox), clear on/off states
- **Tables**: Minimal styling, row hover, mono for data values
- **API keys**: Mono font, copy-to-clipboard interaction

---

### Command Palette (`Ctrl+K`)

**Layout Philosophy**: Spotlight/Alfred-style command launcher.

#### Design

```
[Overlay Modal, centered, max-width: 600px]

Structure:

  1. Search Input
     - Mono font, large (1.25rem)
     - Placeholder: "Type a command or search..." (--neutral-400)
     - No border, just bottom border (2px, --accent-primary)
     - Auto-focused on open
  
  2. Results List
     - Grouped by category:
       • Quick Actions (top)
       • Pages (navigation)
       • Recent (history)
       • Integrations
     - Each result item:
       • Icon (left, 20px)
       • Title (IBM Plex Sans, bold)
       • Shortcut/Category (right, mono, --neutral-400)
       • Keyboard navigation: ↑↓ to select, Enter to execute
     - Selected item: --neutral-100 background, thick left border
  
  3. Footer
     - Keyboard hints: ↑↓ Navigate · ↵ Select · Esc Close
     - Mono font, small (0.75rem)

  Example Results:

    Quick Actions
      ⚡ Generate Report                  Ctrl+Shift+R
      📋 Draft New Policy                 Ctrl+Shift+P
      🔗 Connect Integration              
    
    Pages
      📊 Dashboard                        /dashboard
      🛡️ Controls                         /controls
      📁 Evidence                         /evidence
    
    Recent
      POL-IAM-001: Access Management
      AWS Integration Status
```

**Design Details**:
- **Backdrop**: Semi-transparent black (rgba(0,0,0,0.5))
- **Modal**: White, subtle shadow, no border radius
- **Fuzzy search**: Highlights matching characters in results
- **Instant results**: No loading state, filters as you type
- **Keyboard-first**: All navigation via keyboard, mouse optional

---

### Mobile Navigation

**Layout Philosophy**: Bottom navigation + slide-out menu hybrid.

#### Approach 1: Bottom Tab Bar (Primary)

```
[Fixed bottom bar, 5 icons]

Icons (centered):
  - Dashboard (Home icon)
  - Controls (Shield icon)
  - Evidence (File icon)
  - Menu (Hamburger icon)

Each tab:
  - Icon only (24px)
  - Active state: Icon filled + label below (mono, 0.625rem)
  - Inactive: Outline icon, no label
  - Touch target: 48×48px minimum
```

#### Approach 2: Hamburger Menu (Overflow)

```
[Slide-out drawer from left, full-height]

Header:
  - Logo (top-left)
  - Close button (×, top-right)

Navigation Links:
  - Large touch targets (56px height)
  - Icon + Label (mono, 1rem)
  - Active state: Thick left border + status color background
  
Sections:
  1. Main Navigation
     - Dashboard
     - Controls
     - Evidence
     - Integrations
     - Reports
  
  2. Account
     - Settings
     - Team
     - Billing
  
  3. Footer
     - Help & Docs
     - Logout

Backdrop:
  - Semi-transparent black
  - Tap to close
```

**Design Details**:
- **Bottom bar**: Minimal, icon-focused, high-contrast
- **Drawer**: Full-width on small screens, 320px on tablets
- **Transitions**: Slide from left (300ms), fade backdrop
- **Gestures**: Swipe right to close drawer

---

## 4. Component Patterns

### Cards

**Default Card**: Evidence/Document Container

```css
.card {
  background: var(--neutral-50);
  border: 1px solid var(--neutral-200);
  border-radius: 0; /* Sharp corners, editorial aesthetic */
  padding: var(--space-6);
}

.card:hover {
  border-color: var(--neutral-900);
  box-shadow: var(--shadow-card);
}

.card.active {
  border-left: 4px solid var(--status-pass);
  padding-left: calc(var(--space-6) - 3px); /* Compensate for thicker border */
}
```

**Variants**:

- **Status Card**: Colored left border (4px) based on status
- **Metric Card**: Large mono number at top, description below
- **Evidence Card**: Timestamp-first layout, download icon on hover

---

### Buttons

**Primary**: Black background, white text (default action)

```css
.btn-primary {
  background: var(--accent-primary);
  color: var(--accent-primary-fg);
  font-family: 'IBM Plex Sans', sans-serif;
  font-weight: 500;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0;
  transition: background var(--transition-fast);
}

.btn-primary:hover {
  background: var(--accent-primary-hover);
}
```

**Secondary**: Outlined, no fill (secondary action)

```css
.btn-secondary {
  background: transparent;
  color: var(--accent-primary);
  border: 1px solid var(--accent-primary);
  /* Same padding/font as primary */
}

.btn-secondary:hover {
  background: var(--neutral-100);
}
```

**Ghost**: No border, minimal (tertiary action)

```css
.btn-ghost {
  background: transparent;
  color: var(--neutral-600);
  border: none;
  /* Same padding/font */
}

.btn-ghost:hover {
  color: var(--neutral-900);
  background: var(--neutral-100);
}
```

**Status Buttons**: Used for actions with status implications

```css
.btn-status-pass {
  background: var(--status-pass);
  color: white;
}
/* Similar for warn, fail, info */
```

---

### Forms

**Input Fields**: Minimal, border-focused

```css
.input {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 1rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--neutral-300);
  border-radius: 0;
  background: var(--neutral-50);
  color: var(--neutral-900);
  transition: border-color var(--transition-fast);
}

.input:focus {
  outline: none;
  border-color: var(--accent-primary);
  border-width: 2px;
  padding: calc(0.75rem - 1px) calc(1rem - 1px); /* Compensate for thicker border */
}

.input[type="password"],
.input.monospace {
  font-family: 'JetBrains Mono', monospace;
}
```

**Labels**: Left-aligned, above input

```css
.label {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--neutral-800);
  margin-bottom: 0.5rem;
  display: block;
}
```

**Checkboxes & Radios**: Custom styled, high-contrast

```css
.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--neutral-300);
  border-radius: 0;
  background: var(--neutral-50);
}

.checkbox:checked {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  /* Checkmark icon in white */
}
```

---

### Tables

**Data Table**: Minimal styling, content-first

```css
.table {
  width: 100%;
  border-collapse: collapse;
}

.table thead {
  border-bottom: 2px solid var(--neutral-900);
}

.table th {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: left;
  padding: 0.75rem 1rem;
  color: var(--neutral-900);
}

.table td {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.875rem;
  padding: 1rem;
  border-bottom: 1px solid var(--neutral-200);
}

.table tbody tr:hover {
  background: var(--neutral-100);
}

/* Mono columns (IDs, timestamps, numbers) */
.table .col-mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: var(--neutral-600);
}
```

**Sortable Headers**: Arrow indicators

```css
.table th.sortable {
  cursor: pointer;
  user-select: none;
}

.table th.sortable:hover {
  color: var(--accent-primary);
}

/* Arrow icon appears on sorted column */
```

---

### Modals/Dialogs

**Modal Container**: Centered overlay

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--neutral-50);
  border: 1px solid var(--neutral-300);
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: var(--shadow-modal);
}

.modal-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--neutral-200);
}

.modal-header h2 {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.5rem;
  margin: 0;
}

.modal-body {
  padding: var(--space-6);
}

.modal-footer {
  padding: var(--space-6);
  border-top: 1px solid var(--neutral-200);
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}
```

---

### Navigation Elements

**Main Sidebar**: Minimal, text-focused

```css
.sidebar {
  width: 240px;
  background: var(--neutral-50);
  border-right: 1px solid var(--neutral-200);
  padding: var(--space-6) 0;
}

.sidebar-nav-item {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.875rem;
  padding: 0.75rem 1.5rem;
  color: var(--neutral-700);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  transition: background var(--transition-fast);
}

.sidebar-nav-item:hover {
  background: var(--neutral-100);
  color: var(--neutral-900);
}

.sidebar-nav-item.active {
  background: var(--neutral-900);
  color: var(--neutral-50);
  border-left: 4px solid var(--accent-primary);
  padding-left: calc(1.5rem - 4px);
}
```

**Breadcrumbs**: Mono font, slash separators

```css
.breadcrumbs {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: var(--neutral-600);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.breadcrumbs a {
  color: var(--neutral-600);
  text-decoration: none;
}

.breadcrumbs a:hover {
  color: var(--accent-primary);
}

.breadcrumbs-separator {
  color: var(--neutral-400);
}
```

---

## 5. Differentiation Callout

> **"This avoids generic UI by treating the interface as an extension of the audit report itself."**

**What We DO:**
- ✅ Monospace typography for data/headings (instant recognition)
- ✅ Editorial asymmetric layouts (not centered dashboards)
- ✅ Timestamp-first design (evidence provenance)
- ✅ Color = Status only (never decoration)
- ✅ Annotation/versioning UI (like legal documents)
- ✅ Minimal shadows, sharp corners (paper aesthetic)

**What We AVOID:**
- ❌ Glossy gradients (purple/blue SaaS clichés)
- ❌ Centered hero sections with stock photos
- ❌ Rounded corners everywhere
- ❌ Icon-heavy dashboards with low information density
- ❌ Generic Inter/Roboto fonts
- ❌ "Delightful" animations that distract from critical data

**Recognition Test Result:**
Remove the logo. You'd know it's Kushim because:
1. JetBrains Mono headings jump out
2. Left-aligned asymmetric layouts (not centered)
3. Timestamps everywhere (mono, small, --neutral-600)
4. Status color left-borders on cards
5. No visual clutter—just data and actions

---

## 6. Implementation Notes

### Phase 1: Foundation (Week 1)

**Typography & Color**:
1. Add Google Fonts imports for JetBrains Mono & IBM Plex Sans
2. Update `globals.css` with new color variables (keep dark mode)
3. Replace `--font-geist-sans` with `--font-ibm-plex` globally
4. Add utility classes: `.font-mono`, `.font-sans`, `.text-mono-*`, `.text-display-*`

**Component Library**:
1. Update shadcn/ui components to use new color variables
2. Remove border-radius from `--radius` (set to 0 or 2px max)
3. Update button variants in `/components/ui/button.tsx`
4. Update card styles in `/components/ui/card.tsx` (remove shadows)

### Phase 2: Layout Refactor (Week 2)

**Grid System**:
1. Add `.grid-editorial` utility to `globals.css`
2. Create `.container` with asymmetric margins
3. Add responsive breakpoints (mobile-first)

**Page Templates**:
1. Create layout components: `EditorialLayout.tsx`, `WizardLayout.tsx`
2. Update existing pages to use new layouts (start with dashboard)
3. Implement sticky headers, asymmetric sidebars

### Phase 3: Page-Specific Designs (Week 3-4)

**Landing Page**:
1. Rebuild hero section (left-aligned, no gradient)
2. Update feature cards (minimal, no bg)
3. Simplify pricing cards (border emphasis, no shadows)

**Dashboard**:
1. Redesign metric cards (large mono numbers)
2. Implement AI insights banner (highlight-yellow bg)
3. Update control status table (mono headings)

**Integration Details**:
1. Create activity stream component (timeline-style)
2. Build evidence card grid (timestamp-first)
3. Add configuration sidebar (8-4 split)

**Report Generator**:
1. Build wizard stepper component
2. Create report preview pane (PDF-like styling)
3. Implement export options panel

**Policy Detail**:
1. Create document viewer (numbered sections, annotations)
2. Build version history timeline (sidebar)
3. Add approval workflow UI

**Settings**:
1. Implement tabbed interface (sticky tabs)
2. Build form layouts for each tab
3. Create team table with invite form

### Phase 4: Interactive Elements (Week 5)

**Command Palette**:
1. Build modal overlay component
2. Implement fuzzy search (use existing library)
3. Add keyboard navigation (↑↓ ⏎)

**Mobile Navigation**:
1. Create bottom tab bar component
2. Build slide-out drawer menu
3. Add touch gestures (swipe)

### Phase 5: Polish & Performance (Week 6)

**Animation**:
1. Add transitions to buttons, cards, modals (use defined timing functions)
2. Implement loading states (subtle pulse, no spinners)
3. Test performance (ensure <100ms interactions)

**Accessibility**:
1. Audit color contrast (all must pass WCAG AA)
2. Add keyboard focus styles (2px offset border)
3. Test with screen reader (NVDA/VoiceOver)

**Dark Mode**:
1. Verify all pages work in dark mode
2. Ensure status colors remain high-contrast
3. Test monospace legibility on dark backgrounds

### Developer Tips

**Using Monospace Typography**:
```tsx
// Headings
<h1 className="font-mono text-display-lg">Compliance Score</h1>

// Data values
<span className="font-mono text-mono-base text-neutral-600">
  {timestamp}
</span>

// Control IDs, API keys
<code className="font-mono text-mono-sm">{controlId}</code>
```

**Status Color Application**:
```tsx
// Badge
<Badge className="bg-status-pass-bg text-status-pass border-status-pass-border">
  Compliant
</Badge>

// Card left border
<Card className="border-l-4 border-l-status-warn">
  {/* content */}
</Card>
```

**Editorial Grid**:
```tsx
<div className="grid-editorial">
  <div className="col-main">{/* 8 columns */}</div>
  <div className="col-sidebar">{/* 4 columns */}</div>
</div>
```

**Timestamp Formatting**:
```tsx
// Always ISO 8601, mono font
<time className="font-mono text-mono-sm text-neutral-600">
  {new Date().toISOString()}
</time>
```

### Testing Checklist

- [ ] Typography: JetBrains Mono renders correctly in all browsers
- [ ] Color contrast: All text passes WCAG AA (4.5:1 ratio)
- [ ] Responsive: All layouts work 320px to 1920px
- [ ] Dark mode: All pages readable, status colors high-contrast
- [ ] Accessibility: Keyboard navigation works, focus visible
- [ ] Performance: First paint <1s, interactions <100ms
- [ ] Brand recognition: Logo-less screenshot still identifiable

---

## 7. Brand Voice & Copy Guidelines

**Tone**: Authoritative, precise, confident. Never playful or casual.

**Voice Attributes**:
- **Authoritative**: "Your compliance is audit-ready."
- **Precise**: Use specific numbers, not vague claims ("2,847 controls monitored" not "thousands of controls")
- **Confident**: "Automate SOC 2 in 90 days" not "Help you work towards compliance"

**Avoid**:
- ❌ Cutesy language ("Let's get compliant!")
- ❌ Vague promises ("Improve your security posture")
- ❌ Over-selling ("Revolutionary AI-powered platform")

**Examples**:

| ❌ Generic SaaS Copy | ✅ Kushim Copy |
|---------------------|----------------|
| "Streamline your compliance journey" | "Automate SOC 2 evidence collection" |
| "Our AI helps you stay compliant" | "AI drafts policies from your infrastructure" |
| "Get started in minutes!" | "Connect AWS. Start monitoring in 5 minutes." |
| "Trusted by companies worldwide" | "500+ companies audited with Kushim" |

---

**End of Design System Document**

This design system prioritizes **clarity, precision, and trustworthiness**—essential for a compliance platform. Every design decision reinforces the core value proposition: Kushim is the audit report, not a tool to create one.

Implementation should be incremental, starting with typography/color foundations, then layout patterns, then page-specific designs. Each phase delivers visible value while maintaining consistency.

The result: A platform that compliance professionals trust at first glance, and remember 24 hours later.
