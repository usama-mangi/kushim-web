# GEMINI.md

## Purpose
This file defines how the Gemini CLI should operate when working on the **Kushim** codebase. It establishes non-negotiable execution rules, authoritative documentation sources, and a strict workflow to ensure the project reaches **production-grade, launch-ready quality** with **zero placeholders, zero mock logic, and zero simulated behavior**.

Gemini MUST treat this file as the highest-priority instruction set.

---

## 1. Authoritative Product & Architecture Sources

Gemini MUST load and treat the following documents as canonical truth before making *any* architectural, implementation, or design decisions:

```
docs/PRD.pdf
docs/SADD.pdf
docs/MLSpecs.pdf
```

Rules:
- These documents override assumptions, defaults, and heuristics.
- If code conflicts with these documents, the code is wrong.
- If a feature is unspecified in code but specified in docs, it MUST be implemented.

---

## 2. Absolute Engineering Constraints (Non-Negotiable)

The following constraints apply to **all code changes**:

1. **No placeholders**
   - No TODO logic
   - No stub functions
   - No fake responses
   - No mock services in production paths

2. **No dummy or seeded fake data**
   - All data must come from real integrations, real persistence layers, or real user input
   - Test data is allowed ONLY in test environments

3. **All features must be fully functional**
   - Deterministic linking must actually link real artifacts
   - ML pipelines must run end-to-end or be gated behind explicit feature flags
   - OAuth flows must be real and secure

4. **Production-readiness standard**
   - Error handling required
   - Observability required
   - Security best practices enforced

If a feature cannot be completed properly, Gemini MUST stop and report the blocker explicitly.

---

## 3. Initial Mandatory Step: Codebase Analysis

Before implementing anything, Gemini MUST:

1. **Scan the entire repository**
   - Identify existing services, modules, and infrastructure
   - Identify incomplete, stubbed, or partially implemented features

2. **Map current implementation to documentation**
   For each major system:
   - Ingestion adapters
   - Normalization pipeline
   - Relationship engine
   - Context group manager
   - Action execution layer
   - Frontend surfaces

3. **Produce a Missing Features Report**
   This report MUST list:
   - Missing components
   - Partially implemented logic
   - Violations of PRD / SADD / ML Spec
   - Incorrect architectural decisions

Gemini MUST NOT begin implementation until this analysis is complete.

---

## 4. Required Execution Workflow

Gemini MUST follow this exact loop:

### Step 1: Analyze
- Read relevant docs from `docs`
- Read relevant code
- Identify gaps

### Step 2: Propose
- Clearly state:
  - What will be implemented
  - Why it is required (doc reference)
  - Which services/files will change

### Step 3: Implement
- Write production-grade code only
- Follow existing project conventions
- Ensure backward compatibility unless explicitly refactoring

### Step 4: Verify
- Confirm:
  - Feature completeness
  - No placeholder logic remains
  - Errors handled

### Step 5: Proceed to Next Missing Feature

Gemini MUST implement features **one by one**, not in parallel.

---

## 5. Feature Implementation Priority Order

Unless the repository already contradicts this, Gemini MUST prioritize work in the following order:

1. OAuth + Platform Ingestion (Jira, GitHub, Slack)
2. Normalization into KushimStandardRecord
3. Deterministic Linking Engine (per ML Spec Phase 1)
4. Graph Persistence (Artifacts, Links, Context Groups)
5. Context Group Evolution Logic
6. Read-Only Context UI
7. Action Execution Layer
8. ML Shadow Scoring Pipeline
9. Explainability & Feedback Loop

No later feature may be started before earlier ones are complete.

---

## 6. ML-Specific Rules

- Deterministic linking MUST be fully correct before ML is activated
- ML models MUST run in shadow mode first
- No ML-based link may affect users unless confidence thresholds are enforced
- All ML outputs MUST be explainable

If ML infra is incomplete, Gemini MUST gate it cleanly.

---

## 7. Environment Discipline

Gemini MUST respect environment separation:

- `dev`: verbose logging, experimental flags allowed
- `staging`: production parity, no experiments
- `prod`: locked-down, audited, stable

No test shortcuts may leak into staging or prod.

---

## 8. Security & Compliance Requirements

Gemini MUST enforce:

- Encrypted OAuth token storage
- Least-privilege scopes
- Tenant data isolation
- Full audit logging for actions

Any deviation MUST be flagged.

---

## 9. When Gemini MUST Stop and Ask

Gemini MUST stop execution and request clarification if:

- A required external credential is missing
- A platform API has ambiguous behavior
- Docs conflict with each other
- A feature cannot be implemented without violating constraints

---

## 10. Definition of Success

Gemini’s job is complete only when:

- All features defined in `/docs` are implemented
- No placeholder or simulated logic exists
- The system can be deployed and used by real users
- Kushim operates as a true ambient ledger, not a dashboard

---

## Final Directive

Gemini is not assisting a prototype.

Gemini is building **a launch-ready product**.

Shortcuts, simulations, and assumptions are explicitly disallowed.

