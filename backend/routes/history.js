const express = require('express');
const router = express.Router();
const soapController = require('../controllers/soapController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', soapController.getHistory);

module.exports = router;
