const AppError = require('./AppError');
const C = require('../config/constants');

const pad = (n) => String(n).padStart(2, '0');
const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

function parsePositiveInt(value, field) {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (!Number.isInteger(n) || n < 1) {
    throw new AppError(`${field} must be a positive integer`, 400);
  }
  return n;
}

// Parses 'YYYY-MM-DD HH:mm' (or with T, or with :ss). Throws 400 if malformed.
function parseDateTime(input) {
  if (typeof input !== 'string') {
    throw new AppError('appointment_datetime is required (format: YYYY-MM-DD HH:mm)', 400);
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(input.trim());
  if (!m) {
    throw new AppError('appointment_datetime must look like YYYY-MM-DD HH:mm', 400);
  }
  const [y, mo, d, h, mi] = [m[1], m[2], m[3], m[4], m[5]].map(Number);
  const s = m[6] ? Number(m[6]) : 0;
  const dt = new Date(y, mo - 1, d, h, mi, s);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d ||
      dt.getHours() !== h || dt.getMinutes() !== mi) {
    throw new AppError('appointment_datetime is not a real date/time', 400);
  }
  return { dt, y, mo, d, h, mi, s };
}

// Throws 400 for malformed input, 422 for broken business rules.
function validateBookingTime(input, now = new Date()) {
  const { dt, y, mo, d, h, mi, s } = parseDateTime(input);

  if (s !== 0 || mi % C.SLOT_MINUTES !== 0) {
    throw new AppError(`Appointments must start on a ${C.SLOT_MINUTES}-minute boundary`, 422);
  }
  const minutes = h * 60 + mi;
  if (minutes < toMinutes(C.WORK_START) || minutes > toMinutes(C.LAST_SLOT_START)) {
    throw new AppError(
      `Appointments must be within working hours (${C.WORK_START} to ${C.WORK_END}, last start ${C.LAST_SLOT_START})`,
      422
    );
  }
  if (dt.getTime() <= now.getTime()) {
    throw new AppError('Appointments must be in the future', 422);
  }

  const date = `${y}-${pad(mo)}-${pad(d)}`;
  return { date, datetime: `${date} ${pad(h)}:${pad(mi)}:00` };
}

module.exports = { validateBookingTime, parseDateTime, parsePositiveInt };