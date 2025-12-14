const db = require('../db');

/**
 * Generates the DPP (Digital Product Passport) data for a given product identifier.
 * @param {string} productIdentifier - The unique product identifier (e.g., Serial, GTIN).
 * @returns {Promise<Object>} The standardized DPP JSON object.
 */
const generateDPPData = async (productIdentifier) => {
  // 1. Fetch Product and Entity Details
  const productQuery = `
    SELECT 
      p.product_identifier_value,
      p.identifier_type,
      p.batch_number,
      e.entity_id,
      e.entity_name,
      e.geo_region_code,
      vc.barley_unit_value as nrp_score,
      vc.verification_level,
      vc.period_start_date,
      vc.period_end_date
    FROM Product_Identifiers p
    JOIN Entities e ON p.entity_id = e.entity_id
    LEFT JOIN Verified_Claims vc ON p.claim_id = vc.claim_id
    WHERE p.product_identifier_value = $1;
  `;

  const productRes = await db.query(productQuery, [productIdentifier]);

  if (productRes.rows.length === 0) {
    throw new Error('Product not found.');
  }

  const product = productRes.rows[0];

  // 2. Fetch Relevant Regulations (to show compliance coverage)
  // Logic: "Relevant" means any regulation mapped to metric types available in the system.
  // Ideally, we would know exactly which metrics composed the specific claim, but for this prototype,
  // we assume the NRP score covers the "water_level" (from seeds) etc.
  // We'll return a summary of regulations KUSHIM tracks for this entity type.
  const regulationsQuery = `
    SELECT DISTINCT regulation_name
    FROM Regulation_Mappings;
  `;
  const regRes = await db.query(regulationsQuery);
  const regulations = regRes.rows.map(r => r.regulation_name);

  // 3. Structure Data for DPP (aligning with EU ESPR concepts)
  // The structure typically includes Product ID, Manufacturer info, Environmental Footprint (PEF), etc.
  const dppData = {
    product_passport: {
      id: product.product_identifier_value,
      type: product.identifier_type,
      batch: product.batch_number,
      manufacturer: {
        name: product.entity_name,
        location: product.geo_region_code,
        kushim_id: product.entity_id
      }
    },
    sustainability_metrics: {
      kushim_nrp_score: parseFloat(product.nrp_score) || null,
      verification_status: product.verification_level || 'Unverified',
      assessment_period: {
        start: product.period_start_date,
        end: product.period_end_date
      },
      compliant_regulations: regulations
    },
    // Placeholder for composition data which would come from a different table in a full system
    material_composition: {
        // Mock data for prototype
        primary_material: "Cotton",
        recycled_content_percentage: 0 // Default
    }
  };

  return dppData;
};

module.exports = { generateDPPData };
