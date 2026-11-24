const router = require('express').Router();
const c = require('../controllers/reportController');

router.get('/doctors', c.doctors);
router.get('/busy-days', c.busyDays);

module.exports = router;