module.exports = {
  MAX_APPOINTMENTS_PER_DAY: 12,
  SLOT_MINUTES: 30,
  WORK_START: '09:00',
  WORK_END: '17:00',
  LAST_SLOT_START: '16:30',
  REFUND: {
    FULL_HOURS: 48,     // more than 48h before: full refund
    PARTIAL_HOURS: 24,  // 24h up to 48h before: partial refund
    PARTIAL_PERCENT: 50,
    // less than 24h before: no refund
  },
};