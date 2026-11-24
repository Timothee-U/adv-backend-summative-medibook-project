const Appointment = require('../models/appointmentModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { parseId } = require('../utils/validators');
const { validateBookingTime, parsePositiveInt } = require('../utils/bookingRules');
const { audit } = require('../services/auditLog');
const { waitlistQueue, confirmationQueue } = require('../config/queues');

exports.create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const patient_id = parsePositiveInt(body.patient_id, 'patient_id');
  const doctor_id = parsePositiveInt(body.doctor_id, 'doctor_id');
  const { date, datetime } = validateBookingTime(body.appointment_datetime);

  let appointment;
  try {
    appointment = await Appointment.book({ patient_id, doctor_id, datetime, date });
  } catch (err) {
    if (err.status === 409) {
      err.waitlist = {
        available: true,
        how: 'POST /api/waitlist with patient_id, doctor_id, appointment_datetime',
      };
    }
    throw err;
  }

  await audit('booking', { appointment_id: appointment.id, patient_id, doctor_id, datetime });
  try {
    await confirmationQueue.add('confirmation', {
      appointment_id: appointment.id, patient_id, doctor_id, datetime,
    });
  } catch (e) {
    console.error('Could not queue confirmation:', e.message);
  }
  res.status(201).json(appointment);
});

exports.get = asyncHandler(async (req, res) => {
  const appt = await Appointment.findById(parseId(req.params.id));
  if (!appt) throw new AppError('Appointment not found', 404);
  res.json(appt);
});

exports.list = asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query.doctor_id) filters.doctor_id = parsePositiveInt(req.query.doctor_id, 'doctor_id');
  if (req.query.patient_id) filters.patient_id = parsePositiveInt(req.query.patient_id, 'patient_id');
  if (req.query.status) {
    if (!['booked', 'cancelled'].includes(req.query.status)) {
      throw new AppError("status must be 'booked' or 'cancelled'", 400);
    }
    filters.status = req.query.status;
  }
  res.json(await Appointment.findAll(filters));
});

exports.cancel = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const { appointment, refund } = await Appointment.cancel(id);

  await audit('cancellation', {
    appointment_id: id,
    patient_id: appointment.patient_id,
    doctor_id: appointment.doctor_id,
    refund_percent: refund.percent,
    refund_amount: appointment.refund_amount,
  });
  try {
    await waitlistQueue.add('slot-freed', {
      doctor_id: appointment.doctor_id,
      datetime: appointment.appointment_datetime,
    });
  } catch (e) {
    console.error('Could not queue waitlist offer:', e.message);
  }

  res.json({
    message: `Appointment cancelled: ${refund.percent}% refund (${refund.tier})`,
    appointment,
  });
});