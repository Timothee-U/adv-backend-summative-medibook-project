const { calculateRefund, refundAmount } = require('../src/services/refundService');

const APPT = '2026-12-10 10:00:00';

describe('calculateRefund', () => {
  test('more than 48h before gives full refund', () => {
    expect(calculateRefund(APPT, '2026-12-07 09:00:00')).toEqual({ percent: 100, tier: 'full' });
  });
  test('48h plus one minute gives full refund', () => {
    expect(calculateRefund(APPT, '2026-12-08 09:59:00').percent).toBe(100);
  });
  test('exactly 48h gives 50% (boundary)', () => {
    expect(calculateRefund(APPT, '2026-12-08 10:00:00')).toEqual({ percent: 50, tier: 'partial' });
  });
  test('30h before gives 50%', () => {
    expect(calculateRefund(APPT, '2026-12-09 04:00:00').percent).toBe(50);
  });
  test('exactly 24h gives 50% (boundary)', () => {
    expect(calculateRefund(APPT, '2026-12-09 10:00:00').percent).toBe(50);
  });
  test('24h minus one minute gives no refund', () => {
    expect(calculateRefund(APPT, '2026-12-09 10:01:00')).toEqual({ percent: 0, tier: 'none' });
  });
  test('1h before gives no refund', () => {
    expect(calculateRefund(APPT, '2026-12-10 09:00:00').percent).toBe(0);
  });
});

describe('refundAmount', () => {
  test('50% of 150.00 is 75', () => expect(refundAmount('150.00', 50)).toBe(75));
  test('rounds to cents: 50% of 99.99 is 50', () => expect(refundAmount('99.99', 50)).toBe(50));
  test('0% is 0', () => expect(refundAmount('120.00', 0)).toBe(0));
});