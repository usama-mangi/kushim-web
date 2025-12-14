const db = require('../db');
const crypto = require('crypto');

/**
 * Simulates writing a Verified Claim to a Distributed Ledger (DLT).
 * In a production environment, this would use a library like 'ethers' or 'fabric-network'
 * to interact with Ethereum/Polygon or Hyperledger Fabric.
 * 
 * @param {Object} claim - The verified claim object.
 * @returns {Promise<Object>} The DLT transaction receipt.
 */
const recordClaimToDLT = async (claim) => {
  console.log(`[DLT Service] Recording Claim ID ${claim.claim_id} to Distributed Ledger...`);

  // 1. Prepare Payload for DLT (Anchoring)
  // We typically store the hash of the claim data and the entity DID.
  const payload = JSON.stringify({
    claim_id: claim.claim_id,
    entity_id: claim.entity_id,
    audit_hash: claim.audit_hash,
    val: claim.barley_unit_value
  });
  
  const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');

  // 2. Simulate DLT Interaction (Mining/Consensus)
  // Generate a mock transaction hash and block number
  const dltTxHash = '0x' + crypto.randomBytes(32).toString('hex');
  const blockNumber = Math.floor(Math.random() * 1000000) + 10000000;

  // 3. Store the "Receipt" in our local mirror table
  const query = `
    INSERT INTO DLT_Transactions (claim_id, dlt_tx_hash, block_number, payload_hash)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  try {
    const res = await db.query(query, [claim.claim_id, dltTxHash, blockNumber, payloadHash]);
    const receipt = res.rows[0];
    
    console.log(`[DLT Service] Success. Tx Hash: ${receipt.dlt_tx_hash}, Block: ${receipt.block_number}`);
    return receipt;
  } catch (err) {
    console.error('[DLT Service] Error writing to ledger:', err.message);
    throw new Error('DLT Write Failed');
  }
};

module.exports = { recordClaimToDLT };
