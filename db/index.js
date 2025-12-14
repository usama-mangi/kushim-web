const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  user: process.env.DB_USER || 'kushim_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'kushim_db',
  password: process.env.DB_PASSWORD || 'kushim_password',
  port: process.env.DB_PORT || 5432,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

console.log('PostgreSQL connection pool initialized.');

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool // Export the pool directly if more advanced operations are needed
};
