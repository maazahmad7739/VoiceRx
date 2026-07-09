const express = require('express');
const router = express.Router();
const controller = require('../controllers/prescriptionController');
const authMiddleware = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');

// Protect all routes
router.use(authMiddleware);

router.post('/parse', aiLimiter, controller.parseVoice);
router.post('/', controller.createPrescription);
router.get('/patient/:patientId', controller.getPrescriptionsByPatient);
router.get('/:id', controller.getPrescriptionById);

module.exports = router;
