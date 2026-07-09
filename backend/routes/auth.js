const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimit');

router.post('/signup', apiLimiter, authController.signup);
router.post('/login', apiLimiter, authController.login);
router.post('/forgot-password', apiLimiter, authController.forgotPassword);
router.post('/reset-password', apiLimiter, authController.resetPassword);
router.get('/me', authMiddleware, authController.getProfile);
router.get('/demo-accounts', apiLimiter, authController.getDemoAccounts);

module.exports = router;
