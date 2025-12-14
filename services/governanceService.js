const db = require('../db');

/**
 * Creates a new governance proposal.
 */
const createProposal = async (proposerId, data) => {
  const { geo_region_code, metric_type, entity_type, proposed_scarcity_factor, justification } = data;
  
  // Calculate expiration (e.g., 7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const query = `
    INSERT INTO Governance_Proposals (
      proposer_entity_id, target_geo_region_code, target_metric_type, target_entity_type, 
      proposed_scarcity_factor, justification, expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING proposal_id, status, created_at
  `;

  const res = await db.query(query, [
    proposerId, geo_region_code, metric_type, entity_type, 
    proposed_scarcity_factor, justification, expiresAt
  ]);

  return res.rows[0];
};

/**
 * Casts a vote on a proposal.
 */
const castVote = async (voterId, proposalId, choice) => {
  if (!['Yes', 'No'].includes(choice)) {
    throw new Error("Invalid vote choice. Must be 'Yes' or 'No'.");
  }

  // Check if proposal exists and is active
  const propCheck = await db.query('SELECT status, expires_at FROM Governance_Proposals WHERE proposal_id = $1', [proposalId]);
  if (propCheck.rows.length === 0) throw new Error("Proposal not found.");
  if (propCheck.rows[0].status !== 'Pending') throw new Error("Proposal is closed.");
  if (new Date() > new Date(propCheck.rows[0].expires_at)) throw new Error("Proposal has expired.");

  // Simplistic weight: 1.0. Future: Query K-Score for weight.
  const weight = 1.0; 

  const query = `
    INSERT INTO Governance_Votes (proposal_id, voter_entity_id, vote_choice, weight)
    VALUES ($1, $2, $3, $4)
    RETURNING vote_id
  `;

  try {
    const res = await db.query(query, [proposalId, voterId, choice, weight]);
    return res.rows[0];
  } catch (err) {
    if (err.code === '23505') { // Unique violation
        throw new Error("Entity has already voted on this proposal.");
    }
    throw err;
  }
};

/**
 * Gets proposal details with vote tally.
 */
const getProposalDetails = async (proposalId) => {
  const propRes = await db.query('SELECT * FROM Governance_Proposals WHERE proposal_id = $1', [proposalId]);
  if (propRes.rows.length === 0) throw new Error("Proposal not found.");
  
  const proposal = propRes.rows[0];

  const votesRes = await db.query(`
    SELECT vote_choice, SUM(weight) as total_weight, COUNT(*) as count 
    FROM Governance_Votes 
    WHERE proposal_id = $1 
    GROUP BY vote_choice
  `, [proposalId]);

  const tally = { Yes: 0, No: 0 };
  votesRes.rows.forEach(row => {
      tally[row.vote_choice] = parseFloat(row.total_weight);
  });

  return {
      ...proposal,
      vote_tally: tally
  };
};

module.exports = { createProposal, castVote, getProposalDetails };
