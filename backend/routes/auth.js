const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimit');

router.post('/signup', apiLimiter, authController.signup);
router.post('/login', apiLimiter, authController.login);
router.get('/me', authMiddleware, authController.getProfile);

module.exports = router;
