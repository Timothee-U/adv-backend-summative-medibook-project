const express = require('express');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Routes will be added here (patients, doctors, appointments, reports)

app.use(notFound);
app.use(errorHandler);

module.exports = app;