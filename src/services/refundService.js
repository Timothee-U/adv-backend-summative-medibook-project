const C = require('../config/constants');

const pad = (n) => String(n).padStart(2, '0');

// Accepts a Date or 'YYYY-MM-DD HH:mm[:ss]' (as returned by MySQL).
function toDate(value) {
  if (value instanceof Date) return value;
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(value));
  if (!m) throw new Error('Invalid date/time');
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
}

function formatDateTime(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Boundaries: > 48h full; 24h <= x <= 48h partial; < 24h none.
function calculateRefund(appointmentTime, now = new Date()) {
  const hours = (toDate(appointmentTime).getTime() - toDate(now).getTime()) / 3600000;
  if (hours > C.REFUND.FULL_HOURS) return { percent: 100, tier: 'full' };
  if (hours >= C.REFUND.PARTIAL_HOURS) return { percent: C.REFUND.PARTIAL_PERCENT, tier: 'partial' };
  return { percent: 0, tier: 'none' };
}

// Works in cents to avoid floating point errors.
function refundAmount(amountPaid, percent) {
  const cents = Math.round(Number(amountPaid) * 100);
  return Math.round((cents * percent) / 100) / 100;
}

module.exports = { calculateRefund, refundAmount, toDate, formatDateTime };