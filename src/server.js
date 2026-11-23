require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const app = require('./app');
const pool = require('./config/db');

async function start() {
  await fs.mkdir(path.join(__dirname, '..', 'logs'), { recursive: true });

  const conn = await pool.getConnection(); // fails fast if MySQL is unreachable
  conn.release();

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`MediBook API running on port ${port}`));
}

start().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});