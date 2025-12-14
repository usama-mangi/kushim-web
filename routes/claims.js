const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
    const entityId = req.query.entity_id || req.entityId;
    
    if (!entityId) {
        return res.status(400).json({ error: 'entity_id is required' });
    }

    try {
        const { rows } = await db.query(
            'SELECT * FROM Verified_Claims WHERE entity_id = $1 ORDER BY created_at DESC',
            [entityId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Error fetching claims:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
