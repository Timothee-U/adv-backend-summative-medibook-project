const { Queue } = require('bullmq');
const connection = require('./redis');

const waitlistQueue = new Queue('waitlist', { connection });
const confirmationQueue = new Queue('confirmations', { connection });

module.exports = { waitlistQueue, confirmationQueue };