const express = require('express');
const { getActivities, getProjectActivities, getUserActivities } = require('../controllers/activities');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getActivities);
router.route('/project/:id').get(getProjectActivities);
router.route('/user/:id').get(getUserActivities);

module.exports = router;
