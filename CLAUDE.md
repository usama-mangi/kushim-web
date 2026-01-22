# Claude Development Guidelines

## Purpose
This document defines engineering standards and workflow for the **Kushim** codebase to ensure production-grade, launch-ready quality. All AI assistants (Claude, Gemini, etc.) and human developers should follow these guidelines.

---

## Authoritative Documentation

Before making architectural or implementation decisions, consult:

```
docs/PRD.pdf       - Product requirements
docs/SADD.pdf      - System architecture
docs/MLSpecs.pdf   - ML specifications
```

**Rules:**
- Documentation overrides assumptions and defaults
- Code conflicts with docs = code is wrong
- Features specified in docs MUST be implemented

---

## Engineering Constraints

**All code changes must meet:**

1. **No placeholders** - No TODOs, stubs, or mock logic in production paths
2. **Real data only** - All data from real integrations or user input (test data in test env only)
3. **Full functionality** - All features must work end-to-end
4. **Production standards** - Error handling, observability, security required
5. **Accessibility compliance** - WCAG 2.1 Level AA required (see section below)

If a feature cannot be completed properly, stop and report the blocker.

---

## Accessibility Standards (WCAG 2.1 Level AA - MANDATORY)

**All code changes MUST maintain WCAG 2.1 Level AA compliance.**

### Required for ALL Interactive Elements

#### 1. Semantic HTML & ARIA
- ✅ Use semantic HTML5 elements (`<button>`, `<nav>`, `<main>`, `<aside>`, etc.)
- ✅ Add `aria-label` or `aria-labelledby` to all interactive elements
- ✅ Use `aria-describedby` for additional context
- ✅ Add `role` attributes where semantic HTML isn't sufficient
- ✅ Use `aria-live` regions for dynamic content updates
- ✅ Add `aria-expanded`, `aria-pressed`, `aria-checked` for stateful controls
- ✅ Implement `aria-current` for navigation state

**Example:**
```tsx
<button 
  aria-label="Close dialog"
  aria-pressed={isPressed}
  onClick={handleClose}
>
  <X className="w-5 h-5" aria-hidden="true" />
</button>
```

#### 2. Keyboard Navigation (WCAG 2.1.1, 2.1.2)
- ✅ All functionality available via keyboard only
- ✅ Logical tab order (no `tabindex` > 0)
- ✅ Visible focus indicators (`:focus-visible` styles)
- ✅ No keyboard traps (except modals with Esc escape)
- ✅ Support standard keyboard patterns:
  - `Enter`/`Space` for buttons
  - Arrow keys for lists/menus
  - `Esc` to close modals/dropdowns
  - `Tab`/`Shift+Tab` for navigation

**Example:**
```tsx
// Focus trap for modals
const trapRef = useFocusTrap(isOpen);

<div ref={trapRef} role="dialog" aria-modal="true">
  {/* Modal content */}
</div>
```

#### 3. Screen Reader Support
- ✅ Use `useA11yAnnounce()` hook for dynamic updates
- ✅ Add skip links (`<a href="#main-content">Skip to main content</a>`)
- ✅ Provide text alternatives for icons (`aria-hidden="true"` on decorative icons)
- ✅ Use `sr-only` class for screen-reader-only text
- ✅ Test with NVDA (Windows) or VoiceOver (Mac)

**Example:**
```tsx
const announce = useA11yAnnounce();

// On action completion
announce('Form submitted successfully', 'polite');
announce('Error: Invalid input', 'assertive');
```

#### 4. Color & Contrast (WCAG 1.4.3, 1.4.11)
- ✅ Text contrast ratio ≥ 4.5:1 (normal text)
- ✅ Text contrast ratio ≥ 3:1 (large text 18pt+)
- ✅ UI component contrast ≥ 3:1 (borders, icons, states)
- ✅ Never use color as the ONLY indicator
  - ❌ Red/green status without icons/text
  - ✅ Red + ❌ icon + "Error" text
- ✅ Support high-contrast mode

**Example:**
```tsx
// Bad: Color-only indicator
<div className="bg-red-500" />

// Good: Color + icon + text
<div className="flex items-center text-red-500">
  <AlertCircle className="w-4 h-4 mr-2" aria-hidden="true" />
  <span>Error: Invalid input</span>
</div>
```

#### 5. Focus Management (WCAG 2.4.3, 2.4.7)
- ✅ Focus moves logically through the page
- ✅ Focus returns to trigger after closing modals
- ✅ New content receives focus appropriately
- ✅ Focus indicators are clearly visible (4.5:1 contrast minimum)
- ✅ Use `useFocusTrap()` hook for modals/dialogs

**Example:**
```tsx
const previousFocusRef = useRef<HTMLElement | null>(null);

useEffect(() => {
  if (isOpen) {
    previousFocusRef.current = document.activeElement;
  } else if (previousFocusRef.current) {
    previousFocusRef.current.focus();
  }
}, [isOpen]);
```

#### 6. Forms & Inputs (WCAG 3.3.1, 3.3.2)
- ✅ Associate labels with inputs (`<label htmlFor="id">` or `aria-labelledby`)
- ✅ Provide clear error messages
- ✅ Use `aria-invalid` and `aria-describedby` for errors
- ✅ Mark required fields (`aria-required="true"` or `required`)
- ✅ Provide input format hints

**Example:**
```tsx
<div>
  <label htmlFor="email" className="block text-sm font-medium">
    Email Address <span aria-label="required">*</span>
  </label>
  <input
    id="email"
    type="email"
    required
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? "email-error" : "email-hint"}
  />
  {hasError && (
    <p id="email-error" role="alert" className="text-red-500">
      Please enter a valid email address
    </p>
  )}
</div>
```

#### 7. Modals & Dialogs (WCAG 2.4.3)
- ✅ Use `role="dialog"` or `role="alertdialog"`
- ✅ Add `aria-modal="true"`
- ✅ Implement focus trap with `useFocusTrap()` hook
- ✅ Close with `Esc` key
- ✅ Return focus to trigger element on close
- ✅ Prevent body scroll when open

**Example:**
```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
  className="fixed inset-0 z-50"
>
  <h2 id="dialog-title">Confirm Action</h2>
  <p id="dialog-description">Are you sure?</p>
</div>
```

#### 8. Dynamic Content (WCAG 4.1.3)
- ✅ Use `aria-live="polite"` for non-urgent updates
- ✅ Use `aria-live="assertive"` for critical updates
- ✅ Add `aria-atomic="true"` to announce full content
- ✅ Use `useA11yAnnounce()` hook for consistent announcements

#### 9. Images & Icons (WCAG 1.1.1)
- ✅ Provide `alt` text for meaningful images
- ✅ Use `alt=""` or `aria-hidden="true"` for decorative images
- ✅ Icons need text alternatives (label or sr-only text)

**Example:**
```tsx
// Decorative icon
<Github className="w-5 h-5" aria-hidden="true" />

// Meaningful icon
<button aria-label="Delete item">
  <Trash className="w-5 h-5" aria-hidden="true" />
</button>
```

#### 10. Tooltips (WCAG 1.4.13)
- ✅ Triggered on both hover AND focus
- ✅ Dismissible with `Esc` key
- ✅ Don't obscure content
- ✅ Use `aria-describedby` to associate with trigger
- ✅ Minimum 500ms delay before showing

### Accessibility Testing Checklist

Before committing code, verify:

- [ ] All interactive elements have labels
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] All actions work with keyboard only
- [ ] Screen reader announces everything correctly
- [ ] Color contrast meets WCAG AA (use browser DevTools)
- [ ] No color-only indicators
- [ ] Modals have focus traps
- [ ] Error messages are associated with inputs
- [ ] Dynamic content is announced
- [ ] No console errors from accessibility tools

### Accessibility Hooks (Available)

Use these existing hooks from `apps/web/hooks/useA11y.ts`:

```tsx
// Screen reader announcements
const announce = useA11yAnnounce();
announce('Action completed', 'polite');

// Focus trap for modals
const trapRef = useFocusTrap(isOpen);

// Keyboard navigation for lists
const { handleKeyDown } = useKeyboardNav(items.length, onSelect);

// Unique IDs for ARIA relationships
const { labelId, descriptionId } = useA11yIds('input');

// Detect reduced motion preference
const prefersReducedMotion = usePrefersReducedMotion();
```

### Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools Browser Extension](https://www.deque.com/axe/devtools/)

### Penalties for Non-Compliance

- ❌ Code review rejection
- ❌ Build failure (if automated tests exist)
- ❌ Legal compliance issues (Section 508, ADA)
- ❌ Excludes users with disabilities

**Bottom line:** Accessibility is not optional. It's a requirement for every single code change.

---

## Development Workflow

### 1. Analyze
- Read relevant docs
- Review existing code
- Identify gaps
- **Check accessibility of existing patterns**

### 2. Propose
- State what will be implemented
- Explain why (reference docs)
- List affected files
- **Confirm accessibility approach**

### 3. Implement
- Production-grade code only
- Follow project conventions
- Maintain backward compatibility
- **Include ARIA attributes from the start**

### 4. Verify
- Feature completeness
- No placeholder logic
- Errors handled
- **Accessibility checklist passed**

### 5. Iterate
Implement features one by one.

---

## Feature Priority Order

1. OAuth + Platform Ingestion (Jira, GitHub, Slack, Google)
2. Normalization into KushimStandardRecord
3. Deterministic Linking Engine
4. Graph Persistence (Neo4j)
5. Context Group Evolution
6. Read-Only Context UI
7. Action Execution Layer
8. ML Shadow Scoring Pipeline
9. Explainability & Feedback Loop

Complete each before moving to next.

---

## ML-Specific Rules

- Deterministic linking must be fully correct before ML activation
- ML models run in shadow mode first
- ML-based links require confidence thresholds
- All ML outputs must be explainable
- Gate incomplete ML infrastructure cleanly

---

## Environment Discipline

- **dev:** Verbose logging, experimental flags allowed
- **staging:** Production parity, no experiments
- **prod:** Locked-down, audited, stable

No test shortcuts in staging or prod.

---

## Security & Compliance

**Required:**
- Encrypted OAuth token storage
- Least-privilege scopes
- Tenant data isolation
- Full audit logging for actions
- WCAG 2.1 Level AA accessibility compliance (see above)

Flag any deviations.

---

## When to Stop and Ask

Stop execution and request clarification if:
- Required credentials missing
- Platform API behavior ambiguous
- Documentation conflicts
- Feature cannot be implemented without violating constraints
- **Accessibility requirement cannot be met with current approach**

---

## Definition of Success

Project is complete when:
- All features in `/docs` are implemented
- No placeholder or simulated logic exists
- System can be deployed and used by real users
- Kushim operates as true ambient ledger
- **All features are fully accessible to users with disabilities**

---

## Code Style & Conventions

### TypeScript
- Use strict mode
- No `any` types (use `unknown` or proper types)
- Export interfaces for reusable types

### React
- Use functional components with hooks
- Prefer `const` over `let`
- Extract reusable logic into custom hooks

### CSS (Tailwind)
- Use consistent spacing scale
- Follow existing color palette
- Add dark mode classes where applicable

### Accessibility
- **Always include ARIA attributes when creating components**
- Test with keyboard before committing
- Use semantic HTML first, ARIA second

---

**Target:** Launch-ready product that works for everyone, not a prototype.

---

**Last Updated:** 2026-01-22 (Phase 2 - Accessibility Requirements Expanded)
