const express = require('express');
const router = express.Router();
const multer = require('multer');
const soapController = require('../controllers/soapController');
const authMiddleware = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');

// Multer memory storage configuration for file buffers
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB max file size
  }
});

// Protect all routes
router.use(authMiddleware);

router.post('/generate-text', aiLimiter, soapController.generateSoapFromText);
router.post('/generate-audio', upload.single('audio'), aiLimiter, soapController.generateSoapFromAudio);
router.get('/stats/dashboard', soapController.getDashboardStats);
router.get('/:id', soapController.getSoapNoteById);
router.put('/:id', soapController.updateSoapNote);

module.exports = router;
