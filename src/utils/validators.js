const AppError = require('./AppError');

function parseId(value) {
  if (!/^\d+$/.test(String(value)) || Number(value) < 1) {
    throw new AppError('id must be a positive integer', 400);
  }
  return Number(value);
}

function requireText(body, field, max) {
  const v = body[field];
  if (typeof v !== 'string' || v.trim() === '') {
    throw new AppError(`${field} is required`, 400);
  }
  if (v.trim().length > max) {
    throw new AppError(`${field} must be at most ${max} characters`, 400);
  }
  return v.trim();
}

function validateEmail(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
    throw new AppError('email is not a valid email address', 400);
  }
  return email.toLowerCase();
}

function validatePhone(phone) {
  if (!/^[0-9+\-\s()]{7,20}$/.test(phone)) {
    throw new AppError('phone must be 7-20 characters: digits, spaces, + - ( )', 400);
  }
  return phone;
}

function validateFee(value) {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n)) {
    throw new AppError('consultation_fee must be a number', 400);
  }
  if (n < 0) throw new AppError('consultation_fee cannot be negative', 400);
  if (n > 99999999.99) throw new AppError('consultation_fee is too large', 400);
  if (Math.abs(n * 100 - Math.round(n * 100)) > 1e-6) {
    throw new AppError('consultation_fee can have at most 2 decimal places', 400);
  }
  return Math.round(n * 100) / 100;
}

function validatePatientInput(body = {}) {
  return {
    full_name: requireText(body, 'full_name', 100),
    email: validateEmail(requireText(body, 'email', 150)),
    phone: validatePhone(requireText(body, 'phone', 20)),
  };
}

function validateDoctorInput(body = {}) {
  return {
    full_name: requireText(body, 'full_name', 100),
    specialty: requireText(body, 'specialty', 100),
    consultation_fee: validateFee(body.consultation_fee),
    room: requireText(body, 'room', 20),
  };
}

module.exports = {
  parseId,
  validateEmail,
  validatePhone,
  validateFee,
  validatePatientInput,
  validateDoctorInput,
};