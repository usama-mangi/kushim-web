# GEMINI.md: Production Implementation Protocol

## 1. Role & Context
You are the Lead Implementation Engineer for **Project Kushim**. Your goal is to build a production-ready system based on the specifications in the `/docs` folder (PRD, SRS, SAD, Schema, API, EDD).

## 2. Iterative Workflow
1. **Contextual Review:** Read the relevant documentation.
2. **Implementation:** Write production-grade code.
3. **Verification:** Self-check and manual verification.
4. **Commit & Transition:** Finalize and move to next.

## 3. Implementation Roadmap

### Phase 1: Foundation & IAM (Identity & Access Management)
- [x] **F1.1: Project Scaffolding.** Setup Next.js, NestJS, Tailwind, and Docker Compose. (DONE)
- [x] **F1.2: Database Migration.** Execute the SQL schema for `roles` and `users`. (DONE)
- [x] **F1.3: Authentication Engine.** Implement Argon2 hashing, JWT strategy, and Passport.js. (DONE)
- [x] **F1.4: RBAC Guard.** Middleware to enforce role-based permissions on API routes. (DONE)

### Phase 2: Data Aggregation Engine
- [x] **F2.1: Adapter Interface.** Define the abstract class and normalization logic. (DONE)
- [x] **F2.2: Infrastructure (Queue).** Setup Redis and BullMQ worker. (DONE)
- [x] **F2.3: First Integration.** Implement the GitHub or Jira adapter as a reference. (DONE)
- [x] **F2.4: Persistence Logic.** Implement the UPSERT logic with SHA-256 checksums. (DONE)

### Phase 3: Real-Time & Frontend UI
- [x] **F3.1: WebSocket Gateway.** NestJS Socket.io gateway with Redis Pub/Sub. (DONE)
- [x] **F3.2: Global State.** Setup Zustand/TanStack Query in the frontend. (DONE)
- [x] **F3.3: Unified Dashboard.** Build the main UI to display aggregated records. (DONE)
- [x] **F3.4: Real-time Updates.** Connect the frontend to the WebSocket gateway. (DONE)

### Phase 4: Audit System & Enhanced Security
- [ ] **F4.1: Audit Logging.** Implement a global interceptor to log all data access and mutations.
- [ ] **F4.2: Audit UI.** Dashboard view for administrators to track system activity.
- [ ] **F4.3: MFA (Totp).** Implement Two-Factor Authentication using speakeasy/otplib.
- [ ] **F4.4: OAuth2 Integration.** Support GitHub/Google login providers.

## 4. Execution Commands
- `"Initiate Feature [ID]"` -> Start the implementation.
- `"Verify Feature [ID]"` -> Request manual verification from user.
- `"Commit Feature [ID]"` -> Finalize and move to next.

## 5. Current Status
- **Current Feature:** F4.1 Audit Logging
- **Last Commit:** 8f481cd
- **Blockers:** None