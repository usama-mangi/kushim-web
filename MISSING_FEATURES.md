# Missing Features Report

## 1. Missing Components

### Infrastructure (SADD 9.2, 9.3, 10.1)
- **Vector Store:** Missing. Required for Phase 2 ML linking.
- **Event Bus:** SADD specifies Kafka/Pulsar. Current implementation uses BullMQ (Redis).

## 2. Partially Implemented Logic

### ~~Deterministic Linking (Priority 3)~~ ✅ **COMPLETED**
- **Logic:** `RelationshipService` implements Phase 1 rules.
- ✅ **TF-IDF Keyword Overlap:** Implemented using `natural` library with cosine similarity
- ✅ **Optimization:** Linking migrated to Cypher queries for graph-native performance
- ✅ **All 6 signals implemented:**
  - Explicit ID Match (0.7)
  - URL Reference (0.6)
  - Shared Metadata (0.5)
  - TF-IDF Keyword Overlap (0.3) - **NEW**
  - Actor Overlap (0.2)
  - Temporal Proximity (0.1)
- ✅ **Graph-Optimized:** Uses `GraphService.findLinkingCandidates()` and `GraphService.calculateGraphSignals()`
- ✅ **Fully Tested:** 17/17 unit tests passing

## 3. Completed Features
- **OAuth Integration:** GitHub, Jira (with offline access), Slack, Google Workspace.
- **Ingestion Adapters:** All 5 required adapters implemented.
- **Graph Persistence (Priority 4):**
    -   Neo4j configured.
    -   `GraphService` created.
    -   `IngestionService` syncs Artifacts to Graph.
    -   `RelationshipService` syncs Links to Graph.
- **Deterministic Linking (Priority 3):** ✅ All signals implemented, graph-optimized, fully tested

## 4. Next Recommended Steps

1.  ~~**Refactor Deterministic Linking:** Move linking logic to Cypher queries~~ ✅ **COMPLETED**
2.  **Context Group Evolution:** Move Context Group management entirely to Graph (currently hybrid/Postgres).
3.  **Frontend Graph View:** Visualize the graph data in the frontend.
4.  **Action Execution:** Complete Jira, Slack, and Google action handlers (currently only GitHub)
5.  **ML Scoring:** Replace placeholder semantic similarity with real embeddings
6.  **Explainability UI:** Add link explanation and user feedback system

## 5. Phase 1 Completion Summary (2026-01-19)

**TF-IDF Keyword Overlap Signal:**
- Created `TfIdfService` using `natural` library
- Implements proper tokenization, stopword filtering, and TF-IDF vectorization
- Uses cosine similarity for comparing document vectors
- Integrated into `RelationshipService.calculateLinkScoreOptimized()`
- Threshold: 0.5 similarity = 0.3 weight in overall score
- 11/11 unit tests passing

**Graph-Based Linking Optimization:**
- Added `GraphService.findLinkingCandidates()` - uses Cypher to find candidates
- Added `GraphService.calculateGraphSignals()` - calculates ID match, URL refs, and metadata signals in Cypher
- Updated `RelationshipService.discoverRelationships()` to use graph queries
- Performance improvement: Eliminates PostgreSQL query overhead
- Leverages Neo4j's graph topology and indexing

**Testing:**
- Created `tfidf.service.spec.ts` with 11 comprehensive tests
- Created `relationship.service.spec.ts` with 17 comprehensive tests
- Tests cover all 6 signals individually and in combination
- Tests cover edge cases (empty bodies, special characters, null metadata)
- All tests passing (28/28)

**Build Configuration:**
- Added `NODE_OPTIONS="--max-old-space-size=4096"` to handle `natural` library memory requirements
