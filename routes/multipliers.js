const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all multipliers
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM Context_Multipliers');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching multipliers:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET a specific multiplier by geo_region_code and metric_type
router.get('/:geo_region_code/:metric_type', async (req, res) => {
  const { geo_region_code, metric_type } = req.params;
  try {
    const { rows } = await db.query(
      'SELECT * FROM Context_Multipliers WHERE geo_region_code = $1 AND metric_type = $2',
      [geo_region_code, metric_type]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Multiplier not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching specific multiplier:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST to insert a new multiplier
router.post('/', async (req, res) => {
  const { geo_region_code, metric_type, scarcity_factor } = req.body;
  if (!geo_region_code || !metric_type || scarcity_factor === undefined) {
    return res.status(400).json({ error: 'Missing required fields: geo_region_code, metric_type, scarcity_factor' });
  }
  try {
    const { rows } = await db.query(
      'INSERT INTO Context_Multipliers (geo_region_code, metric_type, scarcity_factor) VALUES ($1, $2, $3) RETURNING *',
      [geo_region_code, metric_type, scarcity_factor]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error inserting new multiplier:', err);
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Multiplier with this geo_region_code and metric_type already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT to update an existing multiplier
router.put('/', async (req, res) => {
  const { geo_region_code, metric_type, scarcity_factor, version } = req.body;
  if (!geo_region_code || !metric_type || scarcity_factor === undefined || version === undefined) {
    return res.status(400).json({ error: 'Missing required fields: geo_region_code, metric_type, scarcity_factor, version' });
  }
  try {
    const { rows } = await db.query(
      'UPDATE Context_Multipliers SET scarcity_factor = $3, version = $4 + 1, updated_at = CURRENT_TIMESTAMP WHERE geo_region_code = $1 AND metric_type = $2 RETURNING *',
      [geo_region_code, metric_type, scarcity_factor, version]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Multiplier not found or version mismatch' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating multiplier:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
