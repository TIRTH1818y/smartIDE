const express = require('express');
const router = express.Router();
const { register, login, getMe, getDevelopers } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validationMiddleware');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', protect, getMe);
router.get('/developers', protect, requireRole('host'), getDevelopers);

module.exports = router;
