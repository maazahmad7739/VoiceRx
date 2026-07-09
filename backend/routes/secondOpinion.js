const express = require('express');
const router = express.Router();
const controller = require('../controllers/secondOpinionController');
const authMiddleware = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');

// Protect all routes
router.use(authMiddleware);

router.post('/analyze', aiLimiter, controller.analyze);
router.post('/save-to-patient', controller.saveToPatient);
router.get('/history', controller.getHistory);
router.get('/:id', controller.getById);

module.exports = router;
