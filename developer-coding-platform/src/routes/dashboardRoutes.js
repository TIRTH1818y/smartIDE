const express = require('express');
const router = express.Router();
const {
  getHostDashboard,
  getDeveloperDashboard,
} = require('../controllers/dashboardController');
const protect = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.get('/host', protect, requireRole('host'), getHostDashboard);
router.get('/developer', protect, requireRole('developer'), getDeveloperDashboard);

module.exports = router;
