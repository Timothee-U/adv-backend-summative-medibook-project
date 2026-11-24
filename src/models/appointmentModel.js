const pool = require('../config/db');
const AppError = require('../utils/AppError');
const C = require('../config/constants');
const { calculateRefund, refundAmount, toDate, formatDateTime } = require('../services/refundService');

async function findById(id) {
  const [rows] = await pool.execute('SELECT * FROM appointments WHERE id = ?', [id]);
  return rows[0] || null;
}

async function findAll({ doctor_id, patient_id, status } = {}) {
  let sql = 'SELECT * FROM appointments WHERE 1=1';
  const params = [];
  if (doctor_id) { sql += ' AND doctor_id = ?'; params.push(doctor_id); }
  if (patient_id) { sql += ' AND patient_id = ?'; params.push(patient_id); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY appointment_datetime';
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Booking in one transaction. Locking the doctor row means two simultaneous
// requests for the same doctor run one after the other, so the daily cap
// cannot be beaten. The UNIQUE index still guards the exact slot.
async function book({ patient_id, doctor_id, datetime, date }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [doctors] = await conn.execute(
      'SELECT id, consultation_fee FROM doctors WHERE id = ? FOR UPDATE',
      [doctor_id]
    );
    if (doctors.length === 0) throw new AppError('Doctor not found', 404);

    const [patients] = await conn.execute('SELECT id FROM patients WHERE id = ?', [patient_id]);
    if (patients.length === 0) throw new AppError('Patient not found', 404);

    const [counts] = await conn.execute(
      `SELECT COUNT(*) AS n FROM appointments
       WHERE doctor_id = ? AND status = 'booked'
         AND appointment_datetime BETWEEN ? AND ?`,
      [doctor_id, `${date} 00:00:00`, `${date} 23:59:59`]
    );
    if (counts[0].n >= C.MAX_APPOINTMENTS_PER_DAY) {
      throw new AppError(
        `Doctor is fully booked on ${date} (max ${C.MAX_APPOINTMENTS_PER_DAY} per day)`,
        409
      );
    }

    const [result] = await conn.execute(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_datetime, amount_paid)
       VALUES (?, ?, ?, ?)`,
      [patient_id, doctor_id, datetime, doctors[0].consultation_fee]
    );

    await conn.commit();
    return findById(result.insertId);
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError('That time slot is already booked for this doctor', 409);
    }
    throw err;
  } finally {
    conn.release();
  }
}
// Cancel + record refund in ONE transaction. The row is locked so two
// simultaneous cancels cannot both succeed. The row is kept for history;
// active_slot becomes NULL, which frees the slot for rebooking.
async function cancel(id, now = new Date()) {
  const conn = await pool.getConnection();
  let refund;
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute('SELECT * FROM appointments WHERE id = ? FOR UPDATE', [id]);
    if (rows.length === 0) throw new AppError('Appointment not found', 404);
    const appt = rows[0];
    if (appt.status === 'cancelled') throw new AppError('Appointment is already cancelled', 409);
    if (toDate(appt.appointment_datetime).getTime() <= now.getTime()) {
      throw new AppError('Cannot cancel an appointment that has already started', 422);
    }

    refund = calculateRefund(appt.appointment_datetime, now);
    const amount = refundAmount(appt.amount_paid, refund.percent);

    await conn.execute(
      `UPDATE appointments SET status = 'cancelled', refund_amount = ?, cancelled_at = ? WHERE id = ?`,
      [amount, formatDateTime(now), id]
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return { appointment: await findById(id), refund };
}

module.exports = { findById, findAll, book, cancel };