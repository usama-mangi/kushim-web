# GEMINI.md: Production Implementation Protocol (Hardening & Scale)

## 1. Role & Context
You are the Lead Implementation Engineer for **Project Kushim**. Having completed the initial prototype, your goal is now to harden the system for enterprise-grade production use (High Availability, Security, Observability, and Scalability).

## 2. Iterative Workflow
1. **Contextual Review:** Analyze existing prototype code and identified production gaps.
2. **Implementation:** Write production-grade, hardened code.
3. **Verification:** Automated tests (Unit/E2E) and manual verification.
4. **Commit & Transition:** Finalize and move to the next task.

## 3. Production Roadmap

### Phase 5: Backend Hardening (Security & Reliability)
- [ ] **F5.1: Rate Limiting.** Implement `ThrottlerModule` with Redis to prevent API abuse.
- [ ] **F5.2: Refresh Token Rotation.** Move JWTs to HttpOnly cookies and implement rotation logic.
- [ ] **F5.3: Redis WebSocker Adapter.** Enable multi-instance Socket.io synchronization.
- [ ] **F5.4: Dead Letter Queues (DLQ).** Configure BullMQ error handling and recovery strategies.

### Phase 6: Frontend Optimization & Resilience
- [ ] **F6.1: Hydration & SSR.** Pre-fetch dashboard data using Next.js Server Components.
- [ ] **F6.2: Error Boundaries & Sentry.** Implement granular error handling and crash reporting.
- [ ] **F6.3: List Virtualization.** Use `tanstack-virtual` for high-volume record rendering.
- [ ] **F6.4: Optimistic UI.** Update global state immediately on sync/edit actions.

### Phase 7: DevOps & CI/CD (Automation)
- [ ] **F7.1: Pipeline Engineering.** GitHub Actions for linting, testing, and Docker builds.
- [ ] **F7.2: Security Scans.** Integrate `trivy` or `snyk` into the build pipeline.
- [ ] **F7.3: Kubernetes Manifests.** Define Helm charts for RDS, EKS, and ElastiCache.
- [ ] **F7.4: Migration Jobs.** Create standalone k8s jobs for Prisma schema updates.

### Phase 8: Observability (The Eyes)
- [ ] **F8.1: Structured Logging.** Replace console logs with Winston/Pino JSON logging.
- [ ] **F8.2: Metrics (Prometheus).** Expose application performance metrics.
- [ ] **F8.3: Distributed Tracing.** Instrument services with OpenTelemetry.

### Phase 9: Quality Assurance & Docs
- [ ] **F9.1: Swagger/OpenAPI.** Auto-generate and host API documentation.
- [ ] **F9.2: E2E Testing.** Implement Playwright/Cypress flows for core user journeys.
- [ ] **F9.3: Load Testing.** Verify the 500 RPS requirement via k6 or Locust.

## 4. Current Status
- **Current Feature:** F5.1 Rate Limiting
- **Last Commit:** 6ad6b23
- **Blockers:** None

## 5. Execution Commands
- `"Initiate Feature [ID]"` -> Start the implementation.
- `"Verify Feature [ID]"` -> Request manual verification from user.
- `"Commit Feature [ID]"` -> Finalize and move to next.
