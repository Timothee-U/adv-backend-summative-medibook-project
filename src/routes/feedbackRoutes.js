const router = require('express').Router();
const c = require('../controllers/feedbackController');

router.get('/', c.page);

module.exports = router;