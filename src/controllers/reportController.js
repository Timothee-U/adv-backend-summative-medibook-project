const Report = require('../models/reportModel');
const Doctor = require('../models/doctorModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { parseId } = require('../utils/validators');
const { formatDateTime } = require('../services/refundService');

exports.doctorStats = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!(await Doctor.findById(id))) throw new AppError('Doctor not found', 404);
  res.json({ doctor_id: id, ...(await Report.doctorStats(id, formatDateTime(new Date()))) });
});

exports.doctors = asyncHandler(async (req, res) => res.json(await Report.doctorsReport()));
exports.busyDays = asyncHandler(async (req, res) => res.json(await Report.busyDays()));