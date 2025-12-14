const express = require('express');
const router = express.Router();
const { calculateRiskMetrics } = require('../services/riskModelService');

// POST /api/v1/risk_model
// Calculates the Resilience-Adjusted Pricing metrics
router.post('/', async (req, res) => {
  try {
    const { entity_id, p_loss } = req.body;

    if (!entity_id) {
      return res.status(400).json({ success: false, message: 'entity_id is required.' });
    }
    if (p_loss === undefined || typeof p_loss !== 'number') {
      return res.status(400).json({ success: false, message: 'p_loss is required and must be a number.' });
    }

    const result = await calculateRiskMetrics(entity_id, p_loss);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Risk Model Error:', error.message);
    if (error.message.includes('pLoss must be')) {
       return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;
