const express = require('express');
const router = express.Router();
const { generateDPPData } = require('../services/dppService');

// GET /api/v1/dpp/product/:id
// Returns the Digital Product Passport data for a specific product identifier
// Note: DPP endpoints are often public or semi-public. For now, we'll make it public.
router.get('/product/:id', async (req, res) => {
  try {
    const productIdentifier = req.params.id;
    
    if (!productIdentifier) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const dppData = await generateDPPData(productIdentifier);
    
    res.status(200).json({
      success: true,
      data: dppData
    });
  } catch (error) {
    console.error('DPP Error:', error.message);
    if (error.message === 'Product not found.') {
       return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;
