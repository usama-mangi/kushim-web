# Accessibility Audit Checklist (WCAG 2.1 Level AA)

**Status:** Pending Manual Testing  
**Priority:** High (Phase 1 - H5)  
**Last Updated:** 2026-01-25

---

## Overview

This checklist ensures the Kushim web application meets WCAG 2.1 Level AA accessibility standards. All items must be verified before production deployment.

---

## 1. Keyboard Navigation (WCAG 2.1.1, 2.1.2)

### Test Procedures

**Test with keyboard only** (disconnect mouse/trackpad):

- [ ] Tab through all interactive elements in logical order
- [ ] Shift+Tab navigates backwards correctly
- [ ] All buttons, links, and form controls are reachable
- [ ] No keyboard traps (can Tab out of all components)
- [ ] Modal dialogs trap focus (Tab cycles within modal)
- [ ] Esc key closes modals and dropdowns
- [ ] Enter/Space activate buttons
- [ ] Arrow keys work for custom controls (if any)

**Focus Indicators:**
- [ ] All focused elements have visible outline/highlight
- [ ] Focus indicator has 4.5:1 contrast ratio minimum
- [ ] Custom focus styles match design system
- [ ] Focus is not hidden by z-index issues

**Expected Focus Order:**
1. Skip links (Skip to main content, Skip to navigation)
2. Navigation menu
3. Main content
4. Forms and buttons
5. Footer

---

## 2. Screen Reader Testing (WCAG 4.1.2)

### Tools
- **Windows:** NVDA (free) or JAWS (commercial)
- **macOS:** VoiceOver (built-in)
- **Linux:** Orca

### Test with NVDA (Windows)

1. **Install NVDA:** https://www.nvaccess.org/download/
2. **Start NVDA:** Ctrl+Alt+N
3. **Navigate:** Use arrow keys, Tab, and heading navigation (H key)

**Test Checklist:**

- [ ] Page title is announced on load
- [ ] Headings are announced with correct levels (H1, H2, etc.)
- [ ] Landmarks are announced (main, nav, aside, footer)
- [ ] All images have alt text (decorative images: alt="" or aria-hidden="true")
- [ ] Form labels are associated with inputs
- [ ] Error messages are announced
- [ ] Dynamic content changes are announced (aria-live regions)
- [ ] Button purposes are clear
- [ ] Link text is descriptive (not "click here")
- [ ] Tables have proper headers (if used)

**Commands to Test:**
- `Insert+F7` - List all links
- `Insert+F5` - List all form fields
- `Insert+F6` - List all headings
- `H` - Jump to next heading
- `K` - Jump to next link
- `F` - Jump to next form field

---

## 3. Color Contrast (WCAG 1.4.3, 1.4.11)

### Tools
- **Browser DevTools:** Lighthouse > Accessibility
- **WebAIM Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **axe DevTools:** Browser extension

### Test Checklist

**Text Contrast (4.5:1 minimum):**
- [ ] Body text vs background
- [ ] Headings vs background
- [ ] Link text vs background
- [ ] Button text vs background
- [ ] Error messages vs background
- [ ] Placeholder text (if used - 4.5:1 required)

**Large Text Contrast (3:1 minimum for 18pt+ or 14pt+ bold):**
- [ ] Large headings
- [ ] Hero text
- [ ] Callout boxes

**UI Component Contrast (3:1 minimum):**
- [ ] Button borders/outlines
- [ ] Input field borders
- [ ] Icon buttons
- [ ] Focus indicators
- [ ] Checkbox/radio button outlines

**Test in Both Modes:**
- [ ] Light mode passes all tests
- [ ] Dark mode passes all tests

---

## 4. Forms & Inputs (WCAG 3.3.1, 3.3.2, 3.3.3)

### Test Checklist

**Labels:**
- [ ] All inputs have associated labels (`<label htmlFor="id">`)
- [ ] Labels are visible (not placeholder-only)
- [ ] Required fields are marked (`aria-required="true"` or `required`)
- [ ] Field purpose is clear from label alone

**Error Handling:**
- [ ] Errors are announced to screen readers (`role="alert"`)
- [ ] Error messages are associated with inputs (`aria-describedby`)
- [ ] Inputs marked invalid (`aria-invalid="true"`)
- [ ] Clear instructions on how to fix errors
- [ ] Focus moves to first error on submission

**Input Hints:**
- [ ] Format requirements stated (e.g., "MM/DD/YYYY")
- [ ] Password requirements listed before input
- [ ] Character limits shown (if applicable)

**Test Cases:**
1. **Login Form:**
   - [ ] Email and password fields have labels
   - [ ] Invalid credentials show clear error message
   - [ ] Error is announced to screen reader

2. **OAuth Connection:**
   - [ ] Platform selection is keyboard accessible
   - [ ] Connect buttons have clear labels
   - [ ] Loading states are announced

---

## 5. Semantic HTML & ARIA (WCAG 1.3.1, 4.1.2)

### Test with DevTools Elements Panel

**Semantic Structure:**
- [ ] `<main>` wraps primary content
- [ ] `<nav>` for navigation areas
- [ ] `<aside>` for sidebars
- [ ] `<footer>` for footer content
- [ ] `<h1>` for page title (only one per page)
- [ ] Heading hierarchy is logical (H1 > H2 > H3, no skips)

**ARIA Labels:**
- [ ] Buttons without text have `aria-label`
- [ ] Icons have `aria-hidden="true"` (if decorative)
- [ ] Custom components have proper roles
- [ ] Live regions use `aria-live="polite"` or `"assertive"`
- [ ] Modals have `role="dialog"` and `aria-modal="true"`

**Skip Links (Already Implemented):**
- [ ] "Skip to main content" is first focusable element
- [ ] "Skip to navigation" is available
- [ ] "Skip to search" is available
- [ ] Skip links are visibly focused (not hidden)

---

## 6. Images & Icons (WCAG 1.1.1)

### Test Checklist

**Meaningful Images:**
- [ ] Have descriptive `alt` text
- [ ] Alt text conveys image purpose/content
- [ ] Alt text is not redundant with surrounding text

**Decorative Images:**
- [ ] Use `alt=""` (empty string)
- [ ] OR `aria-hidden="true"`
- [ ] No title attribute

**Icons:**
- [ ] Icon-only buttons have `aria-label`
- [ ] Icons used for status have text alternative
- [ ] SVG icons have `aria-hidden="true"` (if decorative)

**Test Cases:**
- [ ] Platform logos (GitHub, Jira, etc.) - should have alt text
- [ ] User avatars - should have alt text with user name
- [ ] Background images - CSS only, no alt needed

---

## 7. Modals & Dialogs (WCAG 2.4.3)

### Test Checklist

**Focus Management:**
- [ ] Focus moves to modal on open
- [ ] Focus is trapped within modal
- [ ] Tab cycles through modal elements only
- [ ] Shift+Tab works in reverse
- [ ] Esc key closes modal
- [ ] Focus returns to trigger element on close
- [ ] Background content is inert (aria-hidden="true")

**ARIA Attributes:**
- [ ] `role="dialog"` or `role="alertdialog"`
- [ ] `aria-modal="true"`
- [ ] `aria-labelledby` points to modal title
- [ ] `aria-describedby` points to modal description (if present)

**Keyboard Navigation:**
- [ ] Esc closes modal
- [ ] Enter on "Confirm" button works
- [ ] Can navigate with Tab
- [ ] Can activate close button

---

## 8. Dynamic Content (WCAG 4.1.3)

### Test Checklist

**Live Regions:**
- [ ] Success messages use `aria-live="polite"`
- [ ] Error messages use `aria-live="assertive"`
- [ ] Loading states are announced
- [ ] Toast notifications are announced

**Test with Screen Reader:**
1. Trigger ingestion sync
   - [ ] "Syncing..." is announced
   - [ ] "Sync complete" is announced
   - [ ] Error states are announced

2. Create context group
   - [ ] Success message is announced
   - [ ] New group appears in list

3. Connect OAuth platform
   - [ ] Loading state is announced
   - [ ] Success/error is announced

**useA11yAnnounce Hook:**
- [ ] Hook is used for all dynamic updates
- [ ] Announcements are properly debounced
- [ ] Announcements don't interrupt form fields

---

## 9. Color & Visual Indicators (WCAG 1.4.1)

### Test Checklist

**Never Use Color Alone:**
- [ ] Success states have ✓ icon + green color
- [ ] Error states have ❌ icon + red color
- [ ] Warning states have ⚠️ icon + yellow color
- [ ] Required fields have * + "required" text

**Test with Grayscale Filter:**
1. Enable grayscale in browser DevTools
2. Verify all statuses are distinguishable
3. Check form validation is clear

**High Contrast Mode:**
- [ ] Test in Windows High Contrast Mode
- [ ] All content is visible
- [ ] Focus indicators work
- [ ] Icons are visible

---

## 10. Mobile/Touch Accessibility (WCAG 2.5.5)

### Test Checklist

**Touch Target Size (44x44px minimum):**
- [ ] Buttons are large enough
- [ ] Links have adequate padding
- [ ] Form inputs have sufficient height
- [ ] Icon buttons are 44x44px or larger

**Gestures:**
- [ ] No gestures required (all actions have button alternative)
- [ ] Swipe actions have alternative (if used)
- [ ] Pinch/zoom is allowed

---

## 11. Browser DevTools Audits

### Lighthouse Accessibility Audit

1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Check "Accessibility" only
4. Run audit

**Target Score:** 100/100

**Common Issues to Fix:**
- [ ] Images without alt text
- [ ] Form elements without labels
- [ ] Insufficient color contrast
- [ ] Missing ARIA attributes
- [ ] Duplicate IDs
- [ ] Links without discernible text

### axe DevTools

1. Install: https://www.deque.com/axe/devtools/
2. Open extension
3. Run scan

**Target:** 0 violations, 0 serious issues

---

## 12. Manual Testing Scenarios

### Scenario 1: First-Time User Flow
**Without Mouse, With Screen Reader:**

1. [ ] Arrive at homepage
2. [ ] Tab to "Sign In" button
3. [ ] Activate with Enter
4. [ ] Navigate login form
5. [ ] Hear field labels announced
6. [ ] Submit form
7. [ ] Hear error/success message

### Scenario 2: Connect Platform
**Without Mouse, With Screen Reader:**

1. [ ] Navigate to Sources page
2. [ ] Tab to "Connect Platform" button
3. [ ] Hear button purpose
4. [ ] Select platform (GitHub)
5. [ ] Navigate OAuth flow
6. [ ] Hear confirmation

### Scenario 3: Browse Records
**Without Mouse, With Screen Reader:**

1. [ ] Navigate to Records page
2. [ ] Hear page title
3. [ ] Tab through record cards
4. [ ] Hear record titles and metadata
5. [ ] Activate "View Details"
6. [ ] Navigate modal with keyboard

---

## 13. Automated Testing (Future)

### Tools to Integrate

**Jest + Testing Library:**
```typescript
import { axe } from 'jest-axe';

test('should not have accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

**Playwright/Cypress:**
```typescript
// Add to E2E tests
cy.injectAxe();
cy.checkA11y();
```

---

## 14. Known Issues & Fixes

### Current Status

**Implemented (from guidelines):**
- ✅ Skip links in layout
- ✅ `useA11yAnnounce` hook
- ✅ `useFocusTrap` hook
- ✅ `useKeyboardNav` hook
- ✅ Error boundaries with accessible fallback
- ✅ Semantic HTML structure

**To Verify:**
- ⏸️ All images have alt text
- ⏸️ All buttons have labels
- ⏸️ Color contrast meets 4.5:1
- ⏸️ Focus indicators visible
- ⏸️ Keyboard navigation works
- ⏸️ Screen reader announces everything

---

## 15. Testing Schedule

**Week 1: Automated Testing**
- [ ] Run Lighthouse audit on all pages
- [ ] Run axe DevTools on all pages
- [ ] Fix all critical issues

**Week 2: Keyboard Testing**
- [ ] Test all pages with keyboard only
- [ ] Verify focus management
- [ ] Test modals and dropdowns

**Week 3: Screen Reader Testing**
- [ ] Test with NVDA (Windows)
- [ ] Test with VoiceOver (macOS)
- [ ] Document all issues

**Week 4: Fixes & Retesting**
- [ ] Implement fixes
- [ ] Retest with screen readers
- [ ] Final Lighthouse audit

---

## 16. Success Criteria

**Before Launch:**
- ✅ Lighthouse Accessibility Score: 100/100
- ✅ axe DevTools: 0 violations
- ✅ All manual tests pass
- ✅ Screen reader testing complete
- ✅ Keyboard navigation 100% functional
- ✅ Color contrast 4.5:1 minimum

**Compliance:**
- ✅ WCAG 2.1 Level AA compliant
- ✅ Section 508 compliant
- ✅ ADA compliant

---

## 17. Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [NVDA Download](https://www.nvaccess.org/download/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

---

## 18. Contact & Support

**Accessibility Questions:**
- Review `/apps/web/hooks/useA11y.ts` for existing patterns
- See "Claude Development Guidelines" for accessibility requirements
- Test early, test often

---

**Status:** 🔴 **PENDING MANUAL TESTING** - Automated tests should be run before production deployment.

**Next Steps:**
1. Run Lighthouse audit on all pages
2. Install and run axe DevTools
3. Test keyboard navigation
4. Test with screen reader (at least NVDA or VoiceOver)
5. Fix all issues found
6. Re-test until 100% compliant
