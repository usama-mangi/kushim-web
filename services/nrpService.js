const db = require('../db');

const calculateNRP = async (entityId, startDate, endDate) => {
  let query = 'SELECT SUM(barley_unit_value) as total_nrp FROM Verified_Claims WHERE entity_id = $1';
  let params = [entityId];

  if (startDate && endDate) {
    query += ' AND period_start_date >= $2 AND period_end_date <= $3';
    params.push(startDate, endDate);
  }

  const res = await db.query(query, params);
  
  // Get verification level from the latest claim in the period (or overall if no period)
  let levelQuery = 'SELECT verification_level, created_at FROM Verified_Claims WHERE entity_id = $1';
  let levelParams = [entityId];
  
  if (startDate && endDate) {
    levelQuery += ' AND period_start_date >= $2 AND period_end_date <= $3';
    levelParams.push(startDate, endDate);
  }
  
  levelQuery += ' ORDER BY period_end_date DESC LIMIT 1';

  const latestRes = await db.query(levelQuery, levelParams);

  const totalNRP = res.rows[0].total_nrp || 0;
  const verificationLevel = latestRes.rows.length > 0 ? latestRes.rows[0].verification_level : 'Unverified';
  const latestClaimCreatedAt = latestRes.rows.length > 0 ? latestRes.rows[0].created_at : null;

  let riskFlag = null;
  if (verificationLevel === 'Bronze_SelfReport' && latestClaimCreatedAt) {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
    if (latestClaimCreatedAt < twelveMonthsAgo) {
      riskFlag = 'Low_Trust';
    }
  }

  // Calculate K-Score (Feature 10.3)
  // Normalized 0-100 Creditworthiness Score
  // Logic: 
  // Base Score: log10(NRP + 1) * 20 (Logarithmic scale)
  // Max Base Score capped at 80 for NRP ~ 10000
  // Trust Bonus: +20 for Gold, +10 for Silver, +0 for Bronze/Unverified
  
  let baseKScore = 0;
  if (totalNRP > 0) {
      baseKScore = Math.log10(totalNRP + 1) * 20;
  }
  
  let trustBonus = 0;
  if (verificationLevel === 'Gold_Audit') trustBonus = 20;
  else if (verificationLevel === 'Silver_Sensor') trustBonus = 10;
  
  // Calculate final K-Score, capped at 100
  let kScore = Math.min(Math.round(baseKScore + trustBonus), 100);
  
  // Penalize for Risk Flag
  if (riskFlag === 'Low_Trust') {
      kScore = Math.max(0, kScore - 20);
  }

  return { nrp_score: parseFloat(totalNRP), k_score: kScore, verification_level: verificationLevel, risk_flag: riskFlag };
};

module.exports = { calculateNRP };
