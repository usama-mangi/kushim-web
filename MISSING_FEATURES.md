# Missing Features Report

## 1. Missing Components

### Infrastructure (SADD 9.2, 9.3, 10.1)
- **Vector Store:** Missing. Required for Phase 2 ML linking.
- **Event Bus:** SADD specifies Kafka/Pulsar. Current implementation uses BullMQ (Redis).

## 2. Completed Features

### ~~Deterministic Linking (Priority 3)~~ ✅ **COMPLETED - Phase 1**
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

### ~~Context Group Evolution (Priority 5)~~ ✅ **COMPLETED - Phase 2**
- **Status:** Fully graph-native, no PostgreSQL dependencies
- ✅ **Create, Merge, Split:** All lifecycle operations implemented
- ✅ **Metadata & Health Metrics:**
  - Topics/keywords extraction from group content
  - Coherence score calculation (link density + avg confidence)
  - Status tracking
- ✅ **Smart Split Logic:**
  - Automatic detection of low coherence (< 0.4)
  - Community-based clustering using graph connectivity
  - Minimum group size enforcement (5 artifacts)
- ✅ **Graph-Optimized:** All operations use Cypher queries
- ✅ **Fully Tested:** 18/18 unit tests passing

### OAuth Integration ✅
- **Status:** GitHub, Jira (with offline access), Slack, Google Workspace

### Ingestion Adapters ✅
- **Status:** All 5 required adapters implemented

### Graph Persistence (Priority 4) ✅
- **Status:**  Neo4j configured
  - `GraphService` created
  - `IngestionService` syncs Artifacts to Graph
  - `RelationshipService` syncs Links to Graph
  - Context Groups fully managed in graph

## 3. Next Recommended Steps

1.  ~~**Refactor Deterministic Linking:** Move linking logic to Cypher queries~~ ✅ **COMPLETED**
2.  ~~**Context Group Evolution:** Move Context Group management entirely to Graph~~  ✅ **COMPLETED**
3.  **Frontend Graph View:** Visualize the graph data in the frontend. (Priority 6)
4.  **Action Execution:** Complete Jira, Slack, and Google action handlers (currently only GitHub) (Priority 7)
5.  **ML Scoring:** Replace placeholder semantic similarity with real embeddings (Priority 8)
6.  **Explainability UI:** Add link explanation and user feedback system (Priority 9)

## 4. Phase 1 Completion Summary (2026-01-19)

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

## 5. Phase 2 Completion Summary (2026-01-19)

**Context Group Metadata & Health:**
- Added `coherenceScore` calculation based on link density and average confidence
- Added `topics` extraction using keyword frequency analysis
- Added `status` tracking ('active', etc.)
- All metadata stored directly in Neo4j graph nodes

**Smart Split Logic:**
- Implemented `checkAndSplitGroup()` to detect when groups have low coherence (< 0.4)
- Implemented `splitGroupByCommunities()` using graph connectivity analysis
- Automatically creates new groups when drift is detected
- Minimum group size enforcement prevents over-splitting

**Coherence Calculation:**
- Formula: `(linkDensity * 0.7) + (avgConfidence * 0.3)`
- Link density = actual links / maximum possible links
- Average confidence from existing relationship scores
- Returns 1.0 for new/small groups

**Postgres Schema Cleanup:**
- Removed `ContextGroup` model from Prisma schema
- Removed `ContextGroupMember` model from Prisma schema
- Removed `contextGroups` relation from `UnifiedRecord`
- All context group data now exclusively in Neo4j

**Testing:**
- Created `graph.service.spec.ts` with 18 comprehensive tests
- Tests cover metadata extraction, coherence scoring, split logic
- Tests cover edge cases (empty groups, single artifacts, no links)
- All tests passing (18/18)

**API Updates:**
- `getContextGroups()` now returns coherence scores and topics
- All group operations trigger metadata updates
- Merge operations check for split needs automatically
