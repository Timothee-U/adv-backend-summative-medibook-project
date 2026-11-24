const router = require('express').Router();
const c = require('../controllers/waitlistController');

router.get('/', c.view);
router.post('/', c.join);

module.exports = router;