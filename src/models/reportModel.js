const pool = require('../config/db');
const C = require('../config/constants');

async function doctorStats(doctorId, nowStr) {
  const today = nowStr.slice(0, 10);

  const [[totals]] = await pool.execute(
    `SELECT
       COALESCE(SUM(CASE WHEN status = 'booked' THEN amount_paid
                         ELSE amount_paid - refund_amount END), 0) AS revenue,
       COALESCE(SUM(status = 'booked' AND appointment_datetime > ?), 0) AS upcoming_count
     FROM appointments WHERE doctor_id = ?`,
    [nowStr, doctorId]
  );

  const [daily] = await pool.execute(
    `WITH RECURSIVE days (d, n) AS (
       SELECT CAST(? AS DATE), 1
       UNION ALL
       SELECT d + INTERVAL 1 DAY, n + 1 FROM days WHERE n < 7
     )
     SELECT DATE_FORMAT(days.d, '%Y-%m-%d') AS day, COUNT(a.id) AS appointments
     FROM days
     LEFT JOIN appointments a
       ON a.doctor_id = ? AND a.status = 'booked' AND DATE(a.appointment_datetime) = days.d
     GROUP BY days.d ORDER BY days.d`,
    [today, doctorId]
  );

  const [[util]] = await pool.execute(
    `SELECT COUNT(*) AS booked, 7 * ? AS capacity,
            ROUND(100 * COUNT(*) / (7 * ?), 1) AS percent
     FROM appointments
     WHERE doctor_id = ? AND status = 'booked'
       AND appointment_datetime >= CAST(? AS DATE)
       AND appointment_datetime < DATE_ADD(CAST(? AS DATE), INTERVAL 7 DAY)`,
    [C.MAX_APPOINTMENTS_PER_DAY, C.MAX_APPOINTMENTS_PER_DAY, doctorId, today, today]
  );

  return {
    revenue: totals.revenue,
    upcoming_count: Number(totals.upcoming_count),
    next_7_days: daily,
    utilization: {
      booked: Number(util.booked),
      capacity: Number(util.capacity),
      percent: Number(util.percent),
    },
  };
}

async function doctorsReport() {
  const [rows] = await pool.execute(
    `SELECT d.id, d.full_name, d.specialty,
            COUNT(a.id) AS total_appointments,
            COALESCE(SUM(a.status = 'booked'), 0) AS booked,
            COALESCE(SUM(a.status = 'cancelled'), 0) AS cancelled,
            COALESCE(SUM(CASE WHEN a.status = 'booked' THEN a.amount_paid
                              WHEN a.status = 'cancelled' THEN a.amount_paid - a.refund_amount
                         END), 0) AS revenue
     FROM doctors d
     LEFT JOIN appointments a ON a.doctor_id = d.id
     GROUP BY d.id, d.full_name, d.specialty
     ORDER BY total_appointments DESC, d.id`
  );
  return rows;
}

async function busyDays() {
  const [rows] = await pool.execute(
    `SELECT d.id AS doctor_id, d.full_name AS doctor,
            DATE_FORMAT(a.appointment_datetime, '%Y-%m-%d') AS day,
            COUNT(*) AS booked,
            ROUND(100 * COUNT(*) / ?, 1) AS utilization_percent
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     WHERE a.status = 'booked'
     GROUP BY d.id, d.full_name, day
     HAVING COUNT(*) >= ?
     ORDER BY booked DESC, day
     LIMIT 20`,
    [C.MAX_APPOINTMENTS_PER_DAY, C.BUSY_DAY_THRESHOLD]
  );
  return rows;
}

module.exports = { doctorStats, doctorsReport, busyDays };