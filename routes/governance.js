const express = require('express');
const router = express.Router();
const { createProposal, castVote, getProposalDetails } = require('../services/governanceService');

// POST /api/v1/governance/proposals
// Create a new proposal
router.post('/proposals', async (req, res) => {
  try {
    const proposerId = req.entityId; // From auth middleware
    if (!proposerId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await createProposal(proposerId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/governance/proposals/:id/vote
// Vote on a proposal
router.post('/proposals/:id/vote', async (req, res) => {
  try {
    const voterId = req.entityId;
    if (!voterId) return res.status(401).json({ error: 'Unauthorized' });

    const { choice } = req.body;
    const result = await castVote(voterId, req.params.id, choice);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/v1/governance/proposals/:id
// Get proposal details
router.get('/proposals/:id', async (req, res) => {
  try {
    const result = await getProposalDetails(req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
});

module.exports = router;
