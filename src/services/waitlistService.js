const redis = require('../config/redis');

const key = (doctorId, datetime) => `waitlist:${doctorId}:${datetime}`;

async function join(entry) {
  return redis.rpush(key(entry.doctor_id, entry.datetime), JSON.stringify(entry));
}

async function popFirst(doctorId, datetime) {
  const raw = await redis.lpop(key(doctorId, datetime));
  return raw ? JSON.parse(raw) : null;
}

// Failed promotion: patient goes back to the front and keeps their place.
async function putBack(doctorId, datetime, entry) {
  await redis.lpush(key(doctorId, datetime), JSON.stringify(entry));
}

async function list(doctorId, datetime) {
  const raw = await redis.lrange(key(doctorId, datetime), 0, -1);
  return raw.map((x) => JSON.parse(x));
}

module.exports = { join, popFirst, putBack, list };