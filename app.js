const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON request bodies
app.use(express.static('public')); // Serve static files

const authenticate = require('./middleware/authenticate');
const { ingestRawReading } = require('./services/ingestionService');

// Routers
const authRouter = require('./routes/auth');
const nrpRouter = require('./routes/nrp');
const claimsRouter = require('./routes/claims');
const multipliersRouter = require('./routes/multipliers');
const vcRouter = require('./routes/vc');
const complianceRouter = require('./routes/compliance');
const dppRouter = require('./routes/dpp');
const riskModelRouter = require('./routes/riskModel');
const zkpRouter = require('./routes/zkp');
const governanceRouter = require('./routes/governance');

// Public Routes
app.use('/api/v1', authRouter);
app.use('/api/v1/dpp', dppRouter);
app.use('/api/v1/risk_model', riskModelRouter);
app.use('/api/v1/zkp', zkpRouter);

// Protected Routes
app.use('/api/v1/nrp_score', authenticate, nrpRouter);
app.use('/api/v1/claims', authenticate, claimsRouter);
app.use('/api/v1/vc', authenticate, vcRouter);
app.use('/api/v1/compliance', authenticate, complianceRouter);
app.use('/api/v1/governance', authenticate, governanceRouter);

// Ingestion API endpoint
app.post('/api/v1/raw_reading', authenticate, async (req, res) => {
  try {
    const result = await ingestRawReading(req.body, req.entityId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Ingestion error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Multipliers API endpoint
app.use('/api/v1/multipliers', multipliersRouter);

// Initialize background jobs
require('./jobs/claimsProcessor');

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
