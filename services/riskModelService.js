const db = require('../db');
const { calculateNRP } = require('./nrpService');

/**
 * Calculates the Resilience-Adjusted Pricing metrics for a given entity.
 * @param {string} entityId - The entity ID to assess.
 * @param {number} pLoss - The base probability of loss (0.0 to 1.0) input by the insurer.
 * @returns {Promise<Object>} The risk model result containing original and adjusted risk metrics.
 */
const calculateRiskMetrics = async (entityId, pLoss) => {
  if (pLoss < 0 || pLoss > 1) {
    throw new Error('pLoss must be between 0.0 and 1.0');
  }

  // 1. Get the current NRP Score for the entity
  // We use the existing service to get the latest, most accurate score
  const nrpResult = await calculateNRP(entityId);
  const nrpScore = nrpResult.nrp_score;
  const verificationLevel = nrpResult.verification_level;

  // 2. Determine the Risk Mitigation Factor (Lambda)
  // Logic: 
  // - Higher NRP score = Higher resilience = Higher mitigation factor.
  // - Verified data is trusted more than unverified data.
  
  // Base mitigation cap based on verification trust
  let trustMultiplier = 0.5; // Default for unverified/low trust
  if (verificationLevel === 'Gold_Audit') trustMultiplier = 1.0;
  else if (verificationLevel === 'Silver_Sensor') trustMultiplier = 0.8;
  else if (verificationLevel === 'Bronze_SelfReport') trustMultiplier = 0.6;

  // Calculate Lambda based on score magnitude
  // A simplistic model: lambda = (log10(score + 1) / 10) * trustMultiplier
  // This means a score of 1000 gives roughly (3/10) * trust = 0.3 * trust mitigation.
  // Max lambda capped at some reasonable insurance reduction (e.g., 20% max reduction).
  
  // We want NRP > 0 to have *some* effect.
  // Let's use a sigmoid-like or logarithmic scale.
  
  let rawMitigation = 0;
  if (nrpScore > 0) {
      // Example: Score 100 -> log10(101) ~ 2. mitigation -> 0.02
      // Score 10,000 -> log10(10001) ~ 4. mitigation -> 0.04
      rawMitigation = Math.log10(nrpScore + 1) * 0.02; 
  }

  // Apply trust multiplier
  const lambda = rawMitigation * trustMultiplier;

  // Cap total reduction at 15% (0.15) to be conservative for insurers
  const riskMitigationFactor = Math.min(lambda, 0.15);

  // 3. Calculate Adjusted Probability of Loss (P_loss_prime)
  // P_loss' = P_loss * (1 - lambda)
  const adjustedPLoss = pLoss * (1 - riskMitigationFactor);

  return {
    entity_id: entityId,
    nrp_score: nrpScore,
    verification_level: verificationLevel,
    input_p_loss: pLoss,
    risk_mitigation_factor: parseFloat(riskMitigationFactor.toFixed(4)),
    adjusted_p_loss: parseFloat(adjustedPLoss.toFixed(4)),
    calculation_details: {
        trust_multiplier: trustMultiplier,
        formula: "p_loss * (1 - min(log10(nrp + 1) * 0.02 * trust_multiplier, 0.15))"
    }
  };
};

module.exports = { calculateRiskMetrics };
