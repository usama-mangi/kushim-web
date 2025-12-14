const express = require('express');
const router = express.Router();
const { generateZKP } = require('../services/zkpService');

// POST /api/v1/zkp/prove
// Generates a ZKP that the entity's score > threshold
router.post('/prove', async (req, res) => {
  try {
    const { entity_id, threshold } = req.body;

    if (!entity_id || threshold === undefined) {
      return res.status(400).json({ success: false, message: 'entity_id and threshold are required.' });
    }

    const proof = await generateZKP(entity_id, parseFloat(threshold));
    
    res.status(200).json({
      success: true,
      data: proof
    });
  } catch (error) {
    console.error('ZKP Error:', error.message);
    if (error.message.includes('ZKP Generation Failed')) {
       // 422 Unprocessable Entity - The logic holds (valid request) but condition false
       return res.status(422).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;
