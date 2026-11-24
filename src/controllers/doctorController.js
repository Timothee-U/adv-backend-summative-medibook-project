const Doctor = require('../models/doctorModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { parseId, validateDoctorInput } = require('../utils/validators');

exports.list = asyncHandler(async (req, res) => {
  res.json(await Doctor.findAll());
});

exports.get = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(parseId(req.params.id));
  if (!doctor) throw new AppError('Doctor not found', 404);
  res.json(doctor);
});

exports.create = asyncHandler(async (req, res) => {
  const data = validateDoctorInput(req.body);
  res.status(201).json(await Doctor.create(data));
});

exports.update = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const data = validateDoctorInput(req.body);
  if (!(await Doctor.findById(id))) throw new AppError('Doctor not found', 404);
  res.json(await Doctor.update(id, data));
});

exports.remove = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!(await Doctor.remove(id))) throw new AppError('Doctor not found', 404);
  res.status(204).send();
});