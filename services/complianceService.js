const db = require('../db');

/**
 * Generates a compliance report for a given entity and time period.
 * @param {string} entityId - The ID of the entity.
 * @param {string} startDate - The start date for the report period (ISO format).
 * @param {string} endDate - The end date for the report period (ISO format).
 * @returns {Promise<Object>} The structured compliance report.
 */
const generateComplianceReport = async (entityId, startDate, endDate) => {
  // 1. Fetch Verified Claims within the period
  // We join with Entities to get entity details and potentially other tables if needed.
  const claimsQuery = `
    SELECT 
      vc.claim_id,
      vc.entity_id,
      vc.period_start_date,
      vc.period_end_date,
      vc.barley_unit_value,
      vc.verification_level,
      vc.audit_hash,
      e.entity_name,
      e.did
    FROM Verified_Claims vc
    JOIN Entities e ON vc.entity_id = e.entity_id
    WHERE vc.entity_id = $1
      AND vc.period_start_date >= $2 
      AND vc.period_end_date <= $3
    ORDER BY vc.period_start_date ASC;
  `;
  
  const claimsRes = await db.query(claimsQuery, [entityId, startDate, endDate]);
  const claims = claimsRes.rows;

  if (claims.length === 0) {
    throw new Error('No verified claims found for this entity in the specified period.');
  }

  // 2. Fetch Regulation Mappings
  // We want to see which KUSHIM metrics are relevant for regulations. 
  // NOTE: In a real system, we'd link specific claims/readings to specific metric types more granularly.
  // For now, we assume the 'barley_unit_value' is the aggregate score, but the underlying data 
  // (which we aren't fetching deep here, but conceptually exists) is based on metrics like 'water_level'.
  // To demonstrate the feature, we will fetch ALL active regulation mappings to show the potential compliance coverage.
  const regulationsQuery = `
    SELECT 
      rm.regulation_name,
      rm.regulatory_kpi,
      rm.kushim_metric_type,
      md.unit_of_measure
    FROM Regulation_Mappings rm
    JOIN Metric_Definitions md ON rm.kushim_metric_type = md.name
    ORDER BY rm.regulation_name, rm.regulatory_kpi;
  `;
  
  const regRes = await db.query(regulationsQuery);
  const regulationMappings = regRes.rows;

  // 3. Structure the Report
  // Group mappings by Regulation
  const complianceContext = {};
  regulationMappings.forEach(row => {
    if (!complianceContext[row.regulation_name]) {
      complianceContext[row.regulation_name] = [];
    }
    complianceContext[row.regulation_name].push({
      kpi: row.regulatory_kpi,
      related_kushim_metric: row.kushim_metric_type,
      unit: row.unit_of_measure
    });
  });

  const report = {
    report_metadata: {
      generated_at: new Date().toISOString(),
      report_period: { start: startDate, end: endDate },
      entity: {
        id: claims[0].entity_id, // implicitly from query params, but good to be explicit
        name: claims[0].entity_name,
        did: claims[0].did
      }
    },
    compliance_summary: {
      total_claims_processed: claims.length,
      overall_verification_level: claims[claims.length - 1].verification_level, // simplistic: take latest
      compliance_frameworks_covered: Object.keys(complianceContext)
    },
    detailed_claims: claims.map(c => ({
      claim_id: c.claim_id,
      period: { start: c.period_start_date, end: c.period_end_date },
      score: c.barley_unit_value,
      verification: {
        level: c.verification_level,
        audit_hash: c.audit_hash
      }
    })),
    regulatory_context: complianceContext
  };

  return report;
};

module.exports = { generateComplianceReport };
