const Patient = require('../models/patientModel');
const Doctor = require('../models/doctorModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const waitlist = require('../services/waitlistService');
const { audit } = require('../services/auditLog');
const { validateBookingTime, parsePositiveInt } = require('../utils/bookingRules');

exports.join = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const patient_id = parsePositiveInt(body.patient_id, 'patient_id');
  const doctor_id = parsePositiveInt(body.doctor_id, 'doctor_id');
  const { datetime } = validateBookingTime(body.appointment_datetime);
  if (!(await Patient.findById(patient_id))) throw new AppError('Patient not found', 404);
  if (!(await Doctor.findById(doctor_id))) throw new AppError('Doctor not found', 404);

  const position = await waitlist.join({ patient_id, doctor_id, datetime });
  await audit('waitlist_joined', { patient_id, doctor_id, datetime, position });
  res.status(201).json({ message: 'Added to waitlist', position });
});

exports.view = asyncHandler(async (req, res) => {
  const doctor_id = parsePositiveInt(req.query.doctor_id, 'doctor_id');
  const { datetime } = validateBookingTime(req.query.appointment_datetime);
  res.json(await waitlist.list(doctor_id, datetime));
});