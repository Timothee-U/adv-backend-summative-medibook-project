const pool = require('../config/db');

async function findAll() {
  const [rows] = await pool.execute('SELECT * FROM doctors ORDER BY id');
  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute('SELECT * FROM doctors WHERE id = ?', [id]);
  return rows[0] || null;
}

async function create({ full_name, specialty, consultation_fee, room }) {
  const [result] = await pool.execute(
    'INSERT INTO doctors (full_name, specialty, consultation_fee, room) VALUES (?, ?, ?, ?)',
    [full_name, specialty, consultation_fee, room]
  );
  return findById(result.insertId);
}

async function update(id, { full_name, specialty, consultation_fee, room }) {
  await pool.execute(
    'UPDATE doctors SET full_name = ?, specialty = ?, consultation_fee = ?, room = ? WHERE id = ?',
    [full_name, specialty, consultation_fee, room, id]
  );
  return findById(id);
}

async function remove(id) {
  const [result] = await pool.execute('DELETE FROM doctors WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };