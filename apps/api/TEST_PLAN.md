# Test Coverage Implementation Plan (M6)

## Current State

**Overall Coverage:** ~15-20% (estimates from failed test run)
**Target Coverage:** 60%+
**Effort:** 10 days

### Current Issues

1. **Unit Tests Failing (14/18 test suites)**
   - Missing PrismaService mocks
   - Missing dependency injections (UsersService, AuthService, etc.)
   - TypeScript compilation errors
   - Jest configuration issues with node modules

2. **Coverage Gaps**
   - OAuth flows: 0% coverage
   - Platform adapters: 0% coverage
   - Webhook handlers: 0% coverage
   - Graph service: ~4% coverage
   - Relationship discovery: Limited coverage
   - Tenant isolation: Partial coverage

## Implementation Plan

### Phase 1: Fix Existing Tests (Days 1-2)

#### Day 1: Fix Unit Test Infrastructure
- [ ] Fix TypeScript compilation errors
- [ ] Create shared test utilities (`test/utils/`)
  - [ ] `mockPrisma.ts` - Mock PrismaService
  - [ ] `mockRedis.ts` - Mock RedisService
  - [ ] `mockNeo4j.ts` - Mock Neo4jService
  - [ ] `testDb.ts` - Test database utilities
- [ ] Update all failing unit tests to use mocks
- [ ] Fix Jest configuration for node modules
- [ ] Run `npm test` - should pass all unit tests

**Deliverables:**
- All existing unit tests passing
- Reusable test utilities

#### Day 2: Fix Test Coverage Reporting
- [ ] Configure Jest to exclude generated files
- [ ] Add coverage thresholds to jest.config
- [ ] Generate baseline coverage report
- [ ] Document coverage gaps

**Deliverables:**
- Accurate coverage baseline
- Coverage report in HTML format

---

### Phase 2: Integration Tests (Days 3-6)

#### Day 3: OAuth Flow Integration Tests
**File:** `test/integration/oauth.e2e-spec.ts`

Test scenarios:
- [ ] GitHub OAuth complete flow (authorize → callback → token storage)
- [ ] Slack OAuth complete flow
- [ ] Jira OAuth complete flow
- [ ] Google OAuth complete flow
- [ ] Token refresh on expiry
- [ ] OAuth error handling (denied, invalid state)
- [ ] Multiple users same platform
- [ ] Token encryption/decryption

**Coverage Target:** OAuth routes, strategies, oauth.service.ts (80%+)

#### Day 4: Relationship Discovery Integration Tests
**File:** `test/integration/relationship-discovery.e2e-spec.ts`

Test scenarios:
- [ ] Two issues with same participants → creates link
- [ ] PR referencing issue → creates link
- [ ] Slack thread about PR → creates link
- [ ] No common participants → no link
- [ ] Concurrent discovery with distributed locking
- [ ] Link deduplication (same artifacts, same signal)
- [ ] Link explanation generation
- [ ] Multi-signal linking (participant + mention + time)
- [ ] Context group formation after links created

**Coverage Target:** relationship.service.ts, graph.service.ts (60%+)

#### Day 5: Data Ingestion Integration Tests
**File:** `test/integration/ingestion.e2e-spec.ts`

Test scenarios:
- [ ] GitHub ingestion (issues, PRs, commits)
- [ ] Slack ingestion (messages, threads)
- [ ] Jira ingestion (issues, comments)
- [ ] Google Drive ingestion (docs, comments)
- [ ] Duplicate detection via checksum
- [ ] Incremental sync (only new artifacts)
- [ ] Webhook event processing
- [ ] DataSource creation and management
- [ ] Error handling (rate limits, API errors)

**Coverage Target:** ingestion.service.ts, adapters, webhook.processor.ts (70%+)

#### Day 6: Graph Sync Integration Tests
**File:** `test/integration/graph-sync.e2e-spec.ts`

Test scenarios:
- [ ] UnifiedRecord → Neo4j sync
- [ ] RecordLink → Neo4j relationship sync
- [ ] ContextGroup → Neo4j group node sync
- [ ] Failed Neo4j write → retry logic
- [ ] Reconciliation job finds inconsistencies
- [ ] Reconciliation job fixes mismatches
- [ ] Transaction rollback on partial failure
- [ ] Context group graph queries

**Coverage Target:** graph.service.ts (60%+)

---

### Phase 3: Security & Tenant Isolation Tests (Days 7-8)

#### Day 7: Tenant Isolation Tests
**File:** `test/security/tenant-isolation.security.spec.ts` (enhance existing)

Test scenarios:
- [ ] User A cannot see User B's records
- [ ] User A cannot see User B's context groups
- [ ] User A cannot see User B's data sources
- [ ] User A cannot access User B's graph
- [ ] User A cannot trigger User B's ingestion
- [ ] User A cannot execute actions on User B's data
- [ ] Shared platform data (GitHub org) properly scoped
- [ ] Admin endpoints require admin role
- [ ] API key scoped to user
- [ ] Webhook events scoped to correct user

**Coverage Target:** All controllers, guards, security middleware (90%+)

#### Day 8: Authentication & Authorization Tests
**File:** `test/security/auth.security.spec.ts`

Test scenarios:
- [ ] Signup flow with email validation
- [ ] Login with correct credentials
- [ ] Login with incorrect credentials (rate limited)
- [ ] JWT token generation and validation
- [ ] Token refresh flow
- [ ] Token expiry enforcement
- [ ] Password reset flow
- [ ] MFA setup and verification
- [ ] Session management
- [ ] CSRF protection (if implemented)

**Coverage Target:** auth module, guards (80%+)

---

### Phase 4: E2E Critical Flows (Days 9-10)

#### Day 9: E2E User Onboarding & Discovery Flow
**File:** `test/e2e/onboarding.e2e-spec.ts`

Complete user journey:
1. [ ] User signs up
2. [ ] User logs in
3. [ ] User connects GitHub OAuth
4. [ ] User connects Slack OAuth
5. [ ] Initial ingestion runs (GitHub issues, Slack messages)
6. [ ] Relationship discovery runs
7. [ ] Links created between artifacts
8. [ ] Context groups formed
9. [ ] User views graph on /context page
10. [ ] User executes action via command bar
11. [ ] Action logged in audit trail
12. [ ] User logs out

**Coverage Target:** End-to-end integration (50%+)

#### Day 10: E2E Webhook Real-Time Sync Flow
**File:** `test/e2e/webhook-sync.e2e-spec.ts`

Complete webhook journey:
1. [ ] User sets up GitHub webhook
2. [ ] New GitHub issue created (simulated webhook)
3. [ ] Webhook signature verified
4. [ ] Event queued in BullMQ
5. [ ] Processor creates UnifiedRecord
6. [ ] Relationship discovery triggered
7. [ ] Link found to existing Slack message
8. [ ] Graph updated in Neo4j
9. [ ] WebSocket notification sent to user
10. [ ] User sees real-time update in UI

**Coverage Target:** Webhook flow, real-time updates (70%+)

---

## Test Utilities & Infrastructure

### Shared Test Utilities (`test/utils/`)

#### `mockPrisma.ts`
```typescript
export const mockPrismaService = {
  user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  dataSource: { findMany: jest.fn(), create: jest.fn(), delete: jest.fn() },
  unifiedRecord: { findMany: jest.fn(), create: jest.fn(), upsert: jest.fn() },
  recordLink: { findMany: jest.fn(), create: jest.fn() },
  contextGroup: { findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  auditLog: { create: jest.fn() },
  $transaction: jest.fn((callback) => callback(mockPrismaService)),
};
```

#### `testDb.ts`
```typescript
import { PrismaClient } from '@prisma/client';

export async function setupTestDatabase() {
  const prisma = new PrismaClient();
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "DataSource" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "UnifiedRecord" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "RecordLink" CASCADE`;
  return prisma;
}

export async function teardownTestDatabase(prisma: PrismaClient) {
  await prisma.$disconnect();
}

export async function createTestUser(prisma: PrismaClient, overrides = {}) {
  return prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      username: `testuser-${Date.now()}`,
      passwordHash: 'hashed_password',
      ...overrides,
    },
  });
}
```

#### `mockRedis.ts`
```typescript
export const mockRedisService = {
  lock: jest.fn().mockResolvedValue(true),
  unlock: jest.fn().mockResolvedValue(true),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(true),
  del: jest.fn().mockResolvedValue(true),
};
```

#### `mockNeo4j.ts`
```typescript
export const mockNeo4jService = {
  run: jest.fn().mockResolvedValue({ records: [] }),
  writeTransaction: jest.fn((callback) => callback({ run: jest.fn() })),
};
```

### Jest Configuration Updates

**`jest.config.js`** - Add coverage thresholds:
```javascript
module.exports = {
  // ... existing config
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/common/tracing.ts', // OpenTelemetry auto-generated
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};
```

---

## Test Data Fixtures

### `test/fixtures/`

#### `github.fixtures.ts`
```typescript
export const mockGitHubIssue = {
  id: 123,
  number: 1,
  title: 'Test Issue',
  body: 'Test body',
  user: { login: 'testuser' },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  state: 'open',
  labels: [],
};

export const mockGitHubPR = { /* ... */ };
```

#### `slack.fixtures.ts`
```typescript
export const mockSlackMessage = {
  ts: '1609459200.000100',
  user: 'U123456',
  text: 'Test message',
  channel: 'C123456',
  type: 'message',
};
```

---

## Success Criteria

### Quantitative
- [ ] Overall coverage ≥ 60%
- [ ] Critical paths ≥ 80% coverage:
  - OAuth flows
  - Tenant isolation
  - Relationship discovery
  - Data ingestion
- [ ] All tests passing (0 failures)
- [ ] Test suite runs in < 2 minutes

### Qualitative
- [ ] All critical user journeys covered
- [ ] Security vulnerabilities tested
- [ ] Race conditions tested
- [ ] Error scenarios tested
- [ ] Integration points tested
- [ ] Real-time features tested

---

## Timeline Summary

| Day | Focus Area | Deliverable |
|-----|-----------|-------------|
| 1 | Fix unit tests | All unit tests passing |
| 2 | Coverage baseline | Coverage report + gaps |
| 3 | OAuth integration | OAuth flow tests |
| 4 | Relationship discovery | Discovery integration tests |
| 5 | Data ingestion | Ingestion integration tests |
| 6 | Graph sync | Neo4j sync tests |
| 7 | Tenant isolation | Security tests |
| 8 | Auth & authz | Authentication tests |
| 9 | E2E onboarding | User journey tests |
| 10 | E2E webhooks | Real-time sync tests |

---

**Next Steps:**
1. Start with Day 1 - fix existing unit tests
2. Create test utilities
3. Progress through integration tests
4. Achieve 60%+ coverage target

**Last Updated:** 2026-01-30
**Status:** 🚧 In Progress - Day 1
