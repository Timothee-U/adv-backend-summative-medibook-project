const Patient = require('../models/patientModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { parseId, validatePatientInput } = require('../utils/validators');

exports.list = asyncHandler(async (req, res) => {
  res.json(await Patient.findAll());
});

exports.get = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(parseId(req.params.id));
  if (!patient) throw new AppError('Patient not found', 404);
  res.json(patient);
});

exports.create = asyncHandler(async (req, res) => {
  const data = validatePatientInput(req.body);
  res.status(201).json(await Patient.create(data));
});

exports.update = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const data = validatePatientInput(req.body);
  if (!(await Patient.findById(id))) throw new AppError('Patient not found', 404);
  res.json(await Patient.update(id, data));
});

exports.remove = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!(await Patient.remove(id))) throw new AppError('Patient not found', 404);
  res.status(204).send();
});