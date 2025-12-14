const cron = require('node-cron');
const db = require('../db');
const { recordClaimToDLT } = require('../services/dltService'); // Import DLT Service

const processClaimsBatch = async () => {
  console.log('Starting process_claims_batch job...');
  try {
    // 1. Aggregation: Selects raw readings for a specific entity_id within a time window (T1 to T2).
    // For now, let's process all raw readings that haven't been processed yet (e.g., no corresponding claim).
    // In a real scenario, this would involve more sophisticated time windowing and entity selection.
    const rawReadings = await db.query(
      `SELECT
         srr.reading_id,
         srr.entity_id,
         srr.metric_type,
         srr.metric_value,
         srr.device_signature,
         srr.timestamp,
         e.geo_region_code,
         e.entity_type, -- Added entity_type fetch
         md.conversion_to_bu_base
       FROM Sensor_Readings_Raw srr
       JOIN Entities e ON srr.entity_id = e.entity_id
       JOIN Metric_Definitions md ON srr.metric_type = md.name
       WHERE NOT EXISTS (
         SELECT 1
         FROM Verified_Claims vc
         WHERE srr.reading_id = ANY(vc.processed_reading_ids)
       )
       ORDER BY srr.timestamp ASC
       LIMIT 100;` // Process in batches to avoid overwhelming the system
    );

    if (rawReadings.rows.length === 0) {
      console.log('No raw readings to process in this batch.');
      return;
    }

    // Group readings by entity_id for batch processing
    const readingsByEntity = rawReadings.rows.reduce((acc, reading) => {
      acc[reading.entity_id] = acc[reading.entity_id] || [];
      acc[reading.entity_id].push(reading);
      return acc;
    }, {});

    for (const entityId in readingsByEntity) {
      const entityReadings = readingsByEntity[entityId];
      let totalBuClaim = 0;
      const readingIdsForAudit = []; // Fix variable scope: Declare readingIdsForAudit here
      const readingsForAudit = [];
      
      for (const reading of entityReadings) {
        // 2. Context Lookup: Retrieves the entity's geo_region_code (already joined)
        // 3. Multiplier Fetch: Queries Context_Multipliers
        // Logic: Try to find a multiplier that matches both region AND entity_type.
        // If not found, fallback to region only (entity_type IS NULL).
        // Using ORDER BY entity_type NULLS LAST might put specific ones first if we check for equality?
        // Better: ORDER BY entity_type DESC (since non-null string > null usually in sorting logic or we explicit it)
        // PostgreSQL sorts NULLS LAST by default in ASC, FIRST in DESC? No, it depends.
        // Let's use explicit logic: specific match first.
        
        const multiplierResult = await db.query(
          `SELECT scarcity_factor, multiplier_id, version 
           FROM Context_Multipliers 
           WHERE geo_region_code = $1 
             AND metric_type = $2 
             AND (entity_type = $3 OR entity_type IS NULL)
           ORDER BY entity_type NULLS LAST
           LIMIT 1`,
          [reading.geo_region_code, reading.metric_type, reading.entity_type]
        );
        // 'Cotton_Farm' is not null, so it comes before NULL in 'NULLS LAST' (if we sort DESC usually, but here checking if it matches $3 or is null).
        // Actually: We want to prefer the one where entity_type IS NOT NULL.
        // If we order by entity_type, the non-null string usually sorts differently.
        // Safest is length or explicit conditional sort: ORDER BY (entity_type IS NOT NULL) DESC
        
        // Re-writing query for safety:
        /*
        SELECT scarcity_factor, multiplier_id, version
        FROM Context_Multipliers 
        WHERE geo_region_code = $1 
          AND metric_type = $2 
          AND (entity_type = $3 OR entity_type IS NULL)
        ORDER BY CASE WHEN entity_type IS NOT NULL THEN 1 ELSE 0 END DESC
        LIMIT 1
        */

        const robustMultiplierResult = await db.query(
             `SELECT scarcity_factor, multiplier_id, version
              FROM Context_Multipliers 
              WHERE geo_region_code = $1 
                AND metric_type = $2 
                AND (entity_type = $3 OR entity_type IS NULL)
              ORDER BY CASE WHEN entity_type IS NOT NULL THEN 1 ELSE 0 END DESC
              LIMIT 1`,
             [reading.geo_region_code, reading.metric_type, reading.entity_type]
        );
        
        const multiplierRow = robustMultiplierResult.rows[0];
        const scarcityFactor = multiplierRow ? parseFloat(multiplierRow.scarcity_factor) : 1.0; 
        const multiplierVersionId = multiplierRow ? multiplierRow.multiplier_id : null;

        // 4. BU Calculation (The Core Formula): BU_Claim = SUM(Raw Value x Base Conversion x M)
        totalBuClaim += parseFloat(reading.metric_value) * parseFloat(reading.conversion_to_bu_base) * scarcityFactor;
        readingIdsForAudit.push(reading.reading_id); 
        readingsForAudit.push({ id: reading.reading_id, timestamp: reading.timestamp.toISOString() });
        
        // Note: multiplierVersionId is per reading, but claim has one FK.
        // Simplification: We take the last one or main one. Feature 8.3 added FK to Verified_Claims.
        // We'll attach the last used multiplier ID to the claim for traceability.
        // In a real system, mixed multipliers might require creating separate claims or a linking table.
        // We'll set it at the end of loop if needed, but for now we assume uniform context per batch/entity.
        var finalMultiplierVersionId = multiplierVersionId; 
      }

      // Sort by reading_id then timestamp for consistent hashing
      readingsForAudit.sort((a, b) => {
        if (a.id !== b.id) return a.id - b.id;
        return a.timestamp.localeCompare(b.timestamp);
      });

      // 5. Audit Hash Generation: SHA-256 hash of concatenated reading_ids and timestamps
      const auditHash = require('crypto').createHash('sha256').update(JSON.stringify(readingsForAudit)).digest('hex');

      // 6. Claim Write: Writes the final, certified record to Verified_Claims
      // Assuming a default verification_level for now.
      const periodStartDate = entityReadings[0].timestamp;
      const periodEndDate = entityReadings[entityReadings.length - 1].timestamp;

      const claimInsertRes = await db.query(
        `INSERT INTO Verified_Claims (entity_id, period_start_date, period_end_date, barley_unit_value, verification_level, audit_hash, processed_reading_ids, multiplier_version_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [entityId, periodStartDate, periodEndDate, totalBuClaim, 'Bronze', auditHash, readingIdsForAudit, finalMultiplierVersionId]
      );

      const newClaim = claimInsertRes.rows[0];
      console.log(`Processed claim for entity ${entityId}. BU Value: ${totalBuClaim}`);

      // Feature 11.1: Mirror to DLT
      try {
        await recordClaimToDLT(newClaim);
      } catch (dltError) {
        console.error(`Failed to mirror claim ${newClaim.claim_id} to DLT:`, dltError.message);
        // In production, we might want to retry or mark this for later synchronization
      }

      // Mark processed raw readings as claimed (this would require an update to Sensor_Readings_Raw or a linking table)
      // For simplicity, we are adding processed_reading_ids to Verified_Claims to track.
      // This requires modifying Verified_Claims table schema to add processed_reading_ids array column.
    }

    console.log('process_claims_batch job completed successfully.');
  } catch (error) {
    console.error('Error during process_claims_batch job:', error);
  }
};

// Schedule the job to run every day at midnight (00:00)
// For testing, you might want to change this to a more frequent interval, e.g., every minute: '* * * * *'
cron.schedule('* * * * *', () => {
  processClaimsBatch();
});

console.log('Claims batch processor scheduled.');

module.exports = {
  processClaimsBatch
};