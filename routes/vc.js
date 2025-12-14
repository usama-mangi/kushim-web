const express = require('express');
const router = express.Router();
const { generateNRPVC } = require('../services/vcService');

// GET /api/v1/vc/nrp
// Generates a Verifiable Credential for the authenticated entity's latest NRP score
router.get('/nrp', async (req, res) => {
  try {
    const entityId = req.entityId; // Assumes 'authenticate' middleware sets this
    if (!entityId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No entity ID found.' });
    }

    const vc = await generateNRPVC(entityId);
    
    res.status(200).json({
      success: true,
      data: vc
    });
  } catch (error) {
    console.error('VC Generation Error:', error.message);
    if (error.message === 'No verified claims found for this entity.') {
       return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;
