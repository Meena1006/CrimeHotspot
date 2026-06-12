const express = require('express');
const { getAnalytics } = require('../controllers/crimeController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', getAnalytics);

module.exports = router;
