const bcrypt = require('bcrypt');
const db = require('./index');

const seedUsers = async () => {
  const password = 'password123';
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);

  try {
    const res = await db.query(
      `INSERT INTO User_Accounts (username, password_hash, entity_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO NOTHING
       RETURNING *;`,
      ['admin', hash, 'entity-123']
    );
    
    if (res.rows.length > 0) {
      console.log('User seeded:', res.rows[0]);
    } else {
      console.log('User already exists.');
    }
  } catch (err) {
    console.error('Error seeding users:', err);
  } finally {
    // We cannot easily close the pool exported from db/index.js as it doesn't expose an end method directly on the module,
    // but the pool object is exported.
    await db.pool.end();
  }
};

seedUsers();
