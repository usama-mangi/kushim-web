const express = require('express');
const router = express.Router();
const { generateComplianceReport } = require('../services/complianceService');

// GET /api/v1/compliance/report
// Generates a structured compliance report for the authenticated entity
router.get('/report', async (req, res) => {
  try {
    const entityId = req.entityId;
    const { startDate, endDate, format } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate and endDate query parameters are required (ISO format).' });
    }

    const report = await generateComplianceReport(entityId, startDate, endDate);

    // Feature 8.2 mentions PDF/XLS. For this API implementation, we return the structured JSON data 
    // which a frontend or separate service would render into PDF/XLS.
    // However, if 'format' is requested, we can mock the behavior or return a header indicating the file type.
    
    if (format === 'json' || !format) {
        res.status(200).json({
            success: true,
            data: report
        });
    } else {
        // Placeholder for file generation logic
        res.status(501).json({ success: false, message: 'PDF/XLS generation not yet implemented. Please request format=json.' });
    }

  } catch (error) {
    console.error('Compliance Report Error:', error.message);
    if (error.message.includes('No verified claims found')) {
       return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;
