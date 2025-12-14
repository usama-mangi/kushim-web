const apiKeys = require('../config/apiKeys');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers['authorization'];

  if (apiKey) {
    const entityId = apiKeys[apiKey];

    if (!entityId) {
      return res.status(401).send('Unauthorized: Invalid API Key');
    }

    req.entityId = entityId; // Attach entityId to the request object
    return next();
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      req.entityId = decoded.entity_id;
      return next();
    } catch (err) {
      return res.status(401).send('Unauthorized: Invalid Token');
    }
  }

  return res.status(401).send('Unauthorized: API Key or Token missing');
};

module.exports = authenticate;
