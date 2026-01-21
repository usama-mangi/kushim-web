# Development Guidelines

## Purpose
This document defines engineering standards and workflow for the **Kushim** codebase to ensure production-grade, launch-ready quality.

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

If a feature cannot be completed properly, stop and report the blocker.

---

## Development Workflow

### 1. Analyze
- Read relevant docs
- Review existing code
- Identify gaps

### 2. Propose
- State what will be implemented
- Explain why (reference docs)
- List affected files

### 3. Implement
- Production-grade code only
- Follow project conventions
- Maintain backward compatibility

### 4. Verify
- Feature completeness
- No placeholder logic
- Errors handled

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

Flag any deviations.

---

## When to Stop and Ask

Stop execution and request clarification if:
- Required credentials missing
- Platform API behavior ambiguous
- Documentation conflicts
- Feature cannot be implemented without violating constraints

---

## Definition of Success

Project is complete when:
- All features in `/docs` are implemented
- No placeholder or simulated logic exists
- System can be deployed and used by real users
- Kushim operates as true ambient ledger

---

## Accessibility Standards (Added 2026-01-21)

**WCAG 2.1 Level AA Compliance Required:**
- All interactive elements need ARIA labels
- Keyboard navigation for all actions
- Screen reader support
- No color-only indicators
- Focus management for modals
- High-contrast mode support

See `HCI_ANALYSIS.md` for current accessibility status.

---

**Target:** Launch-ready product, not a prototype.
