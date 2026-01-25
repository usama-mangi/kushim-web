-- ML Shadow Mode Analytics Queries
-- Run these queries to evaluate ML performance before enabling production mode

-- ============================================================================
-- 1. SHADOW LINK DISTRIBUTION
-- ============================================================================
-- Shows distribution of ML scores to understand prediction confidence
SELECT 
  CASE 
    WHEN ml_score >= 0.95 THEN 'Excellent (0.95+)'
    WHEN ml_score >= 0.90 THEN 'Very High (0.90-0.95)'
    WHEN ml_score >= 0.85 THEN 'High (0.85-0.90)'
    WHEN ml_score >= 0.80 THEN 'Good (0.80-0.85)'
    WHEN ml_score >= 0.75 THEN 'Threshold (0.75-0.80)'
    WHEN ml_score >= 0.70 THEN 'Below Threshold (0.70-0.75)'
    ELSE 'Low (<0.70)'
  END as score_range,
  COUNT(*) as count,
  ROUND(AVG(deterministic_score)::numeric, 3) as avg_deterministic,
  ROUND(AVG(semantic_score)::numeric, 3) as avg_semantic,
  ROUND(AVG(structural_score)::numeric, 3) as avg_structural,
  ROUND(AVG(ml_score)::numeric, 3) as avg_ml_score
FROM shadow_links
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY score_range
ORDER BY MIN(ml_score) DESC;

-- ============================================================================
-- 2. ML VALUE-ADD: Links ML Would Create That Deterministic Misses
-- ============================================================================
-- These are the "wins" for ML - relationships it finds that rules miss
SELECT 
  sr.external_id as source,
  sr.source_platform as source_platform,
  sr.artifact_type as source_type,
  tr.external_id as target,
  tr.source_platform as target_platform,
  tr.artifact_type as target_type,
  ROUND(sl.ml_score::numeric, 3) as ml_score,
  ROUND(sl.deterministic_score::numeric, 3) as det_score,
  ROUND(sl.semantic_score::numeric, 3) as semantic,
  ROUND(sl.structural_score::numeric, 3) as structural
FROM shadow_links sl
JOIN unified_records sr ON sl.source_record_id = sr.id
JOIN unified_records tr ON sl.target_record_id = tr.id
WHERE sl.ml_score >= 0.75  -- Above ML threshold
  AND sl.deterministic_score < 0.7  -- Below deterministic threshold
  AND sl.created_at >= NOW() - INTERVAL '7 days'
ORDER BY sl.ml_score DESC
LIMIT 50;

-- ============================================================================
-- 3. PRECISION ESTIMATION: Validate Shadow Predictions
-- ============================================================================
-- Checks if ML predictions align with manually created or deterministic links
-- High alignment = high precision
WITH shadow_predictions AS (
  SELECT 
    sl.source_record_id,
    sl.target_record_id,
    sl.ml_score,
    sl.deterministic_score
  FROM shadow_links sl
  WHERE sl.ml_score >= 0.75
    AND sl.deterministic_score < 0.7
    AND sl.created_at >= NOW() - INTERVAL '7 days'
)
SELECT 
  COUNT(*) as total_ml_predictions,
  COUNT(l.id) as validated_by_existing_link,
  ROUND(
    (COUNT(l.id)::float / COUNT(*)::float) * 100, 
    2
  ) as precision_estimate_pct
FROM shadow_predictions sp
LEFT JOIN links l ON (
  (l.source_record_id = sp.source_record_id AND l.target_record_id = sp.target_record_id) OR
  (l.source_record_id = sp.target_record_id AND l.target_record_id = sp.source_record_id)
);

-- ============================================================================
-- 4. RECALL ESTIMATION: Links ML Would Have Found
-- ============================================================================
-- Of existing links, how many would ML have discovered?
WITH existing_links AS (
  SELECT 
    l.source_record_id,
    l.target_record_id,
    l.discovery_method
  FROM links l
  WHERE l.created_at >= NOW() - INTERVAL '7 days'
)
SELECT 
  COUNT(*) as total_existing_links,
  COUNT(sl.id) FILTER (WHERE sl.ml_score >= 0.75) as ml_would_find,
  ROUND(
    (COUNT(sl.id) FILTER (WHERE sl.ml_score >= 0.75)::float / COUNT(*)::float) * 100,
    2
  ) as recall_estimate_pct
FROM existing_links el
LEFT JOIN shadow_links sl ON (
  (sl.source_record_id = el.source_record_id AND sl.target_record_id = el.target_record_id) OR
  (sl.source_record_id = el.target_record_id AND sl.target_record_id = el.source_record_id)
);

-- ============================================================================
-- 5. F1 SCORE CALCULATION
-- ============================================================================
-- Combines precision and recall into single metric
-- F1 = 2 * (precision * recall) / (precision + recall)
WITH metrics AS (
  SELECT 
    -- Precision
    (
      SELECT ROUND(
        (COUNT(l.id)::float / COUNT(*)::float) * 100, 
        2
      )
      FROM shadow_links sl
      LEFT JOIN links l ON (
        (l.source_record_id = sl.source_record_id AND l.target_record_id = sl.target_record_id) OR
        (l.source_record_id = sl.target_record_id AND l.target_record_id = sl.source_record_id)
      )
      WHERE sl.ml_score >= 0.75
        AND sl.deterministic_score < 0.7
        AND sl.created_at >= NOW() - INTERVAL '7 days'
    ) as precision_pct,
    -- Recall
    (
      SELECT ROUND(
        (COUNT(sl.id) FILTER (WHERE sl.ml_score >= 0.75)::float / COUNT(*)::float) * 100,
        2
      )
      FROM links l
      LEFT JOIN shadow_links sl ON (
        (sl.source_record_id = l.source_record_id AND sl.target_record_id = l.target_record_id) OR
        (sl.source_record_id = l.target_record_id AND sl.target_record_id = l.source_record_id)
      )
      WHERE l.created_at >= NOW() - INTERVAL '7 days'
    ) as recall_pct
)
SELECT 
  precision_pct,
  recall_pct,
  ROUND(
    (2.0 * precision_pct * recall_pct) / (precision_pct + recall_pct),
    2
  ) as f1_score
FROM metrics;

-- ============================================================================
-- 6. CROSS-PLATFORM LINK ANALYSIS
-- ============================================================================
-- Shows which platform combinations ML is good at linking
SELECT 
  sr.source_platform || ' -> ' || tr.source_platform as platform_pair,
  COUNT(*) as ml_predictions,
  ROUND(AVG(sl.ml_score)::numeric, 3) as avg_ml_score,
  ROUND(AVG(sl.deterministic_score)::numeric, 3) as avg_det_score,
  ROUND(AVG(sl.semantic_score)::numeric, 3) as avg_semantic
FROM shadow_links sl
JOIN unified_records sr ON sl.source_record_id = sr.id
JOIN unified_records tr ON sl.target_record_id = tr.id
WHERE sl.ml_score >= 0.75
  AND sl.deterministic_score < 0.7
  AND sl.created_at >= NOW() - INTERVAL '7 days'
GROUP BY platform_pair
ORDER BY ml_predictions DESC;

-- ============================================================================
-- 7. TEMPORAL ANALYSIS: ML Performance Over Time
-- ============================================================================
-- Track if ML quality improves or degrades
SELECT 
  DATE(created_at) as date,
  COUNT(*) as shadow_links_created,
  COUNT(*) FILTER (WHERE ml_score >= 0.75) as above_threshold,
  COUNT(*) FILTER (WHERE ml_score >= 0.75 AND deterministic_score < 0.7) as ml_value_add,
  ROUND(AVG(ml_score)::numeric, 3) as avg_ml_score
FROM shadow_links
WHERE created_at >= NOW() - INTERVAL '14 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================================================
-- 8. TOP ML CANDIDATES FOR MANUAL REVIEW
-- ============================================================================
-- Highest-scoring ML predictions for spot-checking quality
SELECT 
  sr.external_id as source_id,
  sr.title as source_title,
  sr.source_platform as source_platform,
  tr.external_id as target_id,
  tr.title as target_title,
  tr.source_platform as target_platform,
  ROUND(sl.ml_score::numeric, 3) as ml_score,
  ROUND(sl.semantic_score::numeric, 3) as semantic,
  ROUND(sl.deterministic_score::numeric, 3) as deterministic
FROM shadow_links sl
JOIN unified_records sr ON sl.source_record_id = sr.id
JOIN unified_records tr ON sl.target_record_id = tr.id
WHERE sl.ml_score >= 0.85
  AND sl.deterministic_score < 0.7
  AND sl.created_at >= NOW() - INTERVAL '7 days'
ORDER BY sl.ml_score DESC
LIMIT 20;

-- ============================================================================
-- 9. FALSE POSITIVE RISK ASSESSMENT
-- ============================================================================
-- Low deterministic score + high ML score = higher risk
SELECT 
  CASE 
    WHEN deterministic_score < 0.3 THEN 'High Risk (Det < 0.3)'
    WHEN deterministic_score < 0.5 THEN 'Medium Risk (Det 0.3-0.5)'
    ELSE 'Low Risk (Det 0.5-0.7)'
  END as risk_category,
  COUNT(*) as count,
  ROUND(AVG(ml_score)::numeric, 3) as avg_ml_score,
  ROUND(AVG(semantic_score)::numeric, 3) as avg_semantic
FROM shadow_links
WHERE ml_score >= 0.75
  AND deterministic_score < 0.7
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY risk_category
ORDER BY MIN(deterministic_score);
