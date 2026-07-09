const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', patientController.createPatient);
router.get('/', patientController.getPatients);
router.get('/:id', patientController.getPatientById);

module.exports = router;
