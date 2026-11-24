const router = require('express').Router();
const c = require('../controllers/doctorController');
const reports = require('../controllers/reportController');

router.get('/', c.list);
router.get('/:id/stats', reports.doctorStats);
router.get('/:id', c.get);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;