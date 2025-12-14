const express = require('express');
const router = express.Router();
const { calculateNRP } = require('../services/nrpService');

router.get('/', async (req, res) => {
    // If authenticated via API Key (Partner) or Session (Dashboard User - later), we might have context.
    // For Partner API: entity_id is passed in query.
    // req.entityId comes from the authenticate middleware if API key is used.
    
    // Logic:
    // 1. If entity_id in query, use it (Partner querying someone else).
    // 2. If no entity_id in query, use req.entityId (Self query).
    
    const targetEntityId = req.query.entity_id || req.entityId;
    
    if (!targetEntityId) {
        return res.status(400).json({ error: 'entity_id is required' });
    }

    try {
        const result = await calculateNRP(targetEntityId);
        res.json(result);
    } catch (err) {
        console.error('Error calculating NRP:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
