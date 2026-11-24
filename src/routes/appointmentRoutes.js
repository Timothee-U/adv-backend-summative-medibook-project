const router = require('express').Router();
const c = require('../controllers/appointmentController');

router.get('/', c.list);
router.get('/:id', c.get);
router.post('/', c.create);

module.exports = router;