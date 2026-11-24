require('dotenv').config();
const { Worker } = require('bullmq');
const connection = require('../config/redis');
const { confirmationQueue } = require('../config/queues');
const Appointment = require('../models/appointmentModel');
const waitlist = require('../services/waitlistService');
const { audit } = require('../services/auditLog');

// A cancellation freed a slot: book the first waitlisted patient.
const waitlistWorker = new Worker(
  'waitlist',
  async (job) => {
    if (job.name !== 'slot-freed') return;
    const { doctor_id, datetime } = job.data;
    const entry = await waitlist.popFirst(doctor_id, datetime);
    if (!entry) return { promoted: false };

    try {
      const appt = await Appointment.book({
        patient_id: entry.patient_id,
        doctor_id,
        datetime,
        date: datetime.slice(0, 10),
      });
      await audit('waitlist_promoted', { appointment_id: appt.id, patient_id: entry.patient_id, doctor_id, datetime });
      await confirmationQueue.add('confirmation', {
        appointment_id: appt.id, patient_id: entry.patient_id, doctor_id, datetime,
      });
      console.log(`Promoted patient ${entry.patient_id} into appointment ${appt.id}`);
      return { promoted: true, appointment_id: appt.id };
    } catch (err) {
      // Never lose the patient: put them back at the front of the queue.
      await waitlist.putBack(doctor_id, datetime, entry);
      await audit('waitlist_promotion_failed', { patient_id: entry.patient_id, doctor_id, datetime, reason: err.message });
      console.error(`Promotion failed (${err.message}); patient ${entry.patient_id} put back`);
      throw err;
    }
  },
  { connection, concurrency: 1 }
);

const confirmationWorker = new Worker(
  'confirmations',
  async (job) => {
    await audit('confirmation', job.data);
    console.log(`Confirmation logged for appointment ${job.data.appointment_id}`);
  },
  { connection }
);

for (const w of [waitlistWorker, confirmationWorker]) {
  w.on('failed', (job, err) => console.error(`Job ${job && job.id} failed: ${err.message}`));
}
console.log('Worker running (waitlist + confirmations). Ctrl+C to stop.');