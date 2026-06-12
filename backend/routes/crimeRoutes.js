const express = require('express');
const {
  addCrime,
  getAllCrimes,
  getFilteredCrimes,
  getHotspots,
  getAnalytics,
} = require('../controllers/crimeController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { crimeValidation } = require('../middleware/validators');

const router = express.Router();

router.use(protect);

router.post('/add', crimeValidation, validate, addCrime);
router.get('/', getAllCrimes);
router.get('/filter', getFilteredCrimes);
router.get('/hotspots', getHotspots);
router.get('/analytics', getAnalytics);

module.exports = router;
