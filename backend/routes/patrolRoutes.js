const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getPatrolLocations,
  generateRoute,
  generateAlternatives,
  lockPatrol,
  markGuarded,
  getHistory,
  getPatrol,
} = require('../controllers/patrolController');

router.use(protect);

router.get('/locations', getPatrolLocations);
router.post('/generate', generateRoute);
router.post('/alternatives', generateAlternatives);
router.post('/lock', lockPatrol);
router.patch('/:id/guard', markGuarded);
router.get('/history', getHistory);
router.get('/:id', getPatrol);

module.exports = router;
