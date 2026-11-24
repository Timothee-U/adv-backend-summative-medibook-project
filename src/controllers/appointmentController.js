const Appointment = require('../models/appointmentModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { parseId } = require('../utils/validators');
const { validateBookingTime, parsePositiveInt } = require('../utils/bookingRules');

exports.create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const patient_id = parsePositiveInt(body.patient_id, 'patient_id');
  const doctor_id = parsePositiveInt(body.doctor_id, 'doctor_id');
  const { date, datetime } = validateBookingTime(body.appointment_datetime);

  // amount_paid comes from the doctor's fee on the server, never from the client
  const appointment = await Appointment.book({ patient_id, doctor_id, datetime, date });
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
  // refund is computed on the server only; nothing from the client body is used
  const { appointment, refund } = await Appointment.cancel(id);
  res.json({
    message: `Appointment cancelled: ${refund.percent}% refund (${refund.tier})`,
    appointment,
  });
});