const { validateBookingTime } = require('../src/utils/bookingRules');
const { validateEmail, validateFee } = require('../src/utils/validators');

const NOW = new Date(2026, 10, 24, 12, 0, 0);

function errorOf(fn) {
  try { fn(); } catch (e) { return e; }
  throw new Error('expected function to throw');
}

describe('validateBookingTime', () => {
  test('accepts a valid future slot', () => {
    expect(validateBookingTime('2026-12-05 09:00', NOW)).toEqual({
      date: '2026-12-05',
      datetime: '2026-12-05 09:00:00',
    });
  });
  test('accepts the last slot 16:30', () => {
    expect(validateBookingTime('2026-12-05 16:30', NOW).datetime).toBe('2026-12-05 16:30:00');
  });
  test('rejects 17:00 (edge case: end of day) with 422', () => {
    expect(errorOf(() => validateBookingTime('2026-12-05 17:00', NOW)).status).toBe(422);
  });
  test('rejects a non-30-minute boundary with 422', () => {
    expect(errorOf(() => validateBookingTime('2026-12-05 09:10', NOW)).status).toBe(422);
  });
  test('rejects the past with 422', () => {
    expect(errorOf(() => validateBookingTime('2026-11-01 10:00', NOW)).status).toBe(422);
  });
  test('rejects an impossible date (Feb 30) with 400', () => {
    expect(errorOf(() => validateBookingTime('2027-02-30 10:00', NOW)).status).toBe(400);
  });
});

describe('other validators', () => {
  test('email without domain is rejected', () => {
    expect(errorOf(() => validateEmail('bad@')).status).toBe(400);
  });
  test('fee with 3 decimals is rejected', () => {
    expect(errorOf(() => validateFee(10.123)).status).toBe(400);
  });
});