# Missing Features Report

## 1. Missing Components

### Infrastructure (SADD 9.2, 9.3, 10.1)
- **Graph Database:** SADD specifies Neo4j or Neptune. Current implementation uses PostgreSQL tables (`Link`, `ContextGroup`).
- **Vector Store:** Missing. Required for Phase 2 ML linking.
- **Event Bus:** SADD specifies Kafka/Pulsar. Current implementation uses BullMQ (Redis).

## 2. Partially Implemented Logic

### Deterministic Linking (Priority 3)
- **Logic:** `RelationshipService` implements most Phase 1 rules.
- **Missing:** "Keyword Overlap (TF-IDF)" signal is missing from the deterministic calculation.

## 3. Violations

- **Architecture:** Usage of PostgreSQL for Graph data violates SADD 9.2.

## 4. Completed Features
- **OAuth Integration:** GitHub, Jira, Slack, Google Workspace implemented with state encryption.
- **Ingestion Adapters:** All 5 required adapters (GitHub, Jira, Slack, Google Docs, Gmail) implemented.

## 5. Next Recommended Steps

1.  **Graph Database Migration (Priority 4):**
    -   Add Neo4j to `docker-compose.yml`.
    -   Create `Neo4jModule` in NestJS.
    -   Migrate `UnifiedRecord`, `Link`, and `ContextGroup` persistence to Neo4j.
2.  **Complete Deterministic Linking (Priority 3):**
    -   Implement TF-IDF/Keyword overlap signal (can be done effectively within Neo4j using graph algorithms or full-text search).