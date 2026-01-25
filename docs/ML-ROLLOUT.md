# ML Shadow Mode & Rollout Plan

## Overview

Kushim uses a hybrid linking approach combining deterministic rules with machine learning. This document outlines the safe deployment strategy using **Shadow Mode**.

## Shadow Mode

Shadow Mode allows ML predictions to be evaluated without affecting production data.

### How It Works

1. **Shadow Mode ON** (`ML_SHADOW_MODE=true`, default):
   - ML scores are calculated for all record pairs
   - ML predictions are logged but NOT actioned
   - Only deterministic links are created
   - Shadow links are persisted to `shadow_links` table for analysis
   
2. **Production Mode** (`ML_SHADOW_MODE=false`):
   - ML predictions create actual links when score exceeds threshold
   - Requires validation period in shadow mode first

## Environment Variables

```bash
# Enable ML scoring but don't create links (recommended for initial deployment)
ML_SHADOW_MODE=true
ML_ENABLED=true

# After validation period, promote to production
ML_SHADOW_MODE=false
ML_ENABLED=true

# Disable ML entirely (deterministic only)
ML_ENABLED=false
```

## Rollout Plan

### Phase 1: Shadow Mode Deployment (Week 1-2)

**Objective:** Collect ML predictions without affecting production

1. Deploy with `ML_SHADOW_MODE=true` and `ML_ENABLED=true`
2. Monitor shadow link creation in `shadow_links` table
3. Review logs for `[SHADOW]` entries showing potential ML links
4. Collect baseline metrics

**Success Criteria:**
- ML scoring runs without errors
- Shadow links are being persisted
- No performance degradation

### Phase 2: Evaluation (Week 3-4)

**Objective:** Validate ML prediction quality

1. Run analytics queries to measure ML performance:
   ```sql
   -- See scripts/ml-shadow-analytics.sql
   ```

2. Calculate key metrics:
   - **Precision**: What % of ML predictions would be correct?
   - **Recall**: What % of true links does ML find?
   - **F1 Score**: Harmonic mean of precision and recall

3. Manual spot-checking:
   - Sample high-scoring ML predictions
   - Verify they represent real relationships
   - Identify false positives

**Success Criteria:**
- Precision ≥ 85%
- Recall ≥ 70%
- F1 Score ≥ 0.75
- False positive rate < 15%

### Phase 3: Gradual Production Rollout (Week 5-6)

**Objective:** Enable ML in production with monitoring

1. **Week 5**: Enable for small subset
   - Set `ML_SHADOW_MODE=false` for 10% of users
   - Monitor for issues
   - Compare ML vs deterministic-only users

2. **Week 6**: Full rollout
   - If metrics remain stable, enable for all users
   - Continue monitoring precision/recall
   - Keep shadow link logging active

**Success Criteria:**
- No increase in user-reported link errors
- Graph coherence scores remain stable
- ML links provide additional value

### Phase 4: Optimization (Ongoing)

**Objective:** Improve ML performance over time

1. Collect feedback on ML-created links
2. Retrain models based on user corrections
3. Adjust thresholds based on observed performance
4. Add new features to improve accuracy

## Monitoring Queries

### Shadow Link Statistics

```sql
-- Count of shadow links by score range
SELECT 
  CASE 
    WHEN ml_score >= 0.9 THEN 'Very High (0.9+)'
    WHEN ml_score >= 0.8 THEN 'High (0.8-0.9)'
    WHEN ml_score >= 0.75 THEN 'Threshold (0.75-0.8)'
    ELSE 'Below Threshold (<0.75)'
  END as score_range,
  COUNT(*) as count,
  AVG(deterministic_score) as avg_deterministic_score,
  AVG(semantic_score) as avg_semantic_score,
  AVG(structural_score) as avg_structural_score
FROM shadow_links
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY score_range
ORDER BY MIN(ml_score) DESC;
```

### ML vs Deterministic Comparison

```sql
-- Links that would be created by ML but not deterministic
SELECT 
  sr.external_id as source_external_id,
  tr.external_id as target_external_id,
  sl.ml_score,
  sl.deterministic_score,
  sl.semantic_score,
  sl.structural_score
FROM shadow_links sl
JOIN unified_records sr ON sl.source_record_id = sr.id
JOIN unified_records tr ON sl.target_record_id = tr.id
WHERE sl.ml_score >= 0.75
  AND sl.deterministic_score < 0.7
  AND sl.created_at >= NOW() - INTERVAL '7 days'
ORDER BY sl.ml_score DESC
LIMIT 100;
```

### Check for existing links (validation)

```sql
-- Validate shadow predictions against actual links
SELECT 
  sl.ml_score,
  sl.deterministic_score,
  CASE 
    WHEN l.id IS NOT NULL THEN 'CORRECT - Link exists'
    ELSE 'UNKNOWN - No link created yet'
  END as validation_status
FROM shadow_links sl
LEFT JOIN links l ON (
  (l.source_record_id = sl.source_record_id AND l.target_record_id = sl.target_record_id) OR
  (l.source_record_id = sl.target_record_id AND l.target_record_id = sl.source_record_id)
)
WHERE sl.ml_score >= 0.75
  AND sl.deterministic_score < 0.7
  AND sl.created_at >= NOW() - INTERVAL '7 days'
LIMIT 100;
```

## Log Monitoring

Watch for shadow mode predictions:

```bash
# Tail API logs for ML shadow predictions
tail -f /path/to/api.log | grep "\[SHADOW\]"

# Example output:
# [SHADOW] ML would link: GH-123 <-> JIRA-456 (ML: 0.82, Det: 0.55) [Link NOT created - Shadow Mode]
```

## Rollback Plan

If issues are detected:

1. **Immediate**: Set `ML_SHADOW_MODE=true` to stop creating ML links
2. **Investigation**: Review logs and shadow_links table
3. **Remediation**: 
   - Identify problematic links created by ML
   - Delete if necessary: `DELETE FROM links WHERE discovery_method = 'ml_assisted'`
4. **Root Cause**: Analyze why ML predictions were incorrect
5. **Fix**: Adjust thresholds, retrain model, or disable temporarily

## Success Metrics

Track these KPIs:

- **ML Link Creation Rate**: # of ML links / total links
- **User Satisfaction**: Feedback on ML-created links
- **Graph Coherence**: Context group coherence scores
- **False Positive Rate**: User-reported incorrect links
- **Coverage**: % of records that gain additional links via ML

## Decision Criteria for Production

Enable production mode (`ML_SHADOW_MODE=false`) only when:

✅ Shadow mode runs successfully for 2+ weeks  
✅ Precision ≥ 85%  
✅ Recall ≥ 70%  
✅ F1 Score ≥ 0.75  
✅ False positive rate < 15%  
✅ No performance degradation  
✅ Manual spot-check validates quality  

## Contact

For questions about ML rollout: [Team Lead/ML Engineer]

**Last Updated:** 2026-01-25
