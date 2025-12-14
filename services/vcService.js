const db = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kushim_secret_key_change_me';

const generateNRPVC = async (entityId) => {
  // Fetch the latest verified claim for the entity
  const query = `
    SELECT 
      claim_id,
      entity_id,
      period_start_date,
      period_end_date,
      barley_unit_value,
      verification_level,
      audit_hash,
      created_at
    FROM Verified_Claims 
    WHERE entity_id = $1 
    ORDER BY created_at DESC 
    LIMIT 1
  `;
  
  const res = await db.query(query, [entityId]);

  if (res.rows.length === 0) {
    throw new Error('No verified claims found for this entity.');
  }

  const claim = res.rows[0];

  // Construct the VC payload (following W3C VC conceptual structure but simplified as a JWT)
  // In a real VC, this would have specific fields like 'vc', 'credentialSubject', etc.
  const payload = {
    sub: claim.entity_id,
    jti: `urn:uuid:${claim.claim_id}`, // Unique identifier for the JWT
    iss: 'did:kushim:registry', // The issuer (us)
    iat: Math.floor(Date.now() / 1000),
    nbf: Math.floor(new Date(claim.period_start_date).getTime() / 1000), // Not valid before the claim period
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'KushimScoreCredential'],
      credentialSubject: {
        id: `did:kushim:${claim.entity_id}`,
        nrp_score: parseFloat(claim.barley_unit_value),
        verification_level: claim.verification_level,
        audit_hash: claim.audit_hash,
        period: {
          start: claim.period_start_date,
          end: claim.period_end_date
        }
      }
    }
  };

  // Sign the VC
  const token = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' }); // HS256 for simplicity now, RS256 preferred for real DIDs

  return {
    token,
    claim_id: claim.claim_id
  };
};

module.exports = { generateNRPVC };
