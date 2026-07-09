require('dotenv').config();

// Startup validation for required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'GEMINI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  throw new Error(`CRITICAL STARTUP ERROR: Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const { apiLimiter } = require('./middleware/rateLimit');

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const soapRoutes = require('./routes/soap');
const historyRoutes = require('./routes/history');
const prescriptionRoutes = require('./routes/prescription');
const secondOpinionRoutes = require('./routes/secondOpinion');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(origin => origin.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local upload files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Apply general API rate limiting to all routes
app.use('/api', apiLimiter);

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/soap', soapRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/second-opinion', secondOpinionRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'VoiceRx Backend is running smoothly.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected error occurred on the server.'
  });
});

// Start listening if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`VoiceRx Server running on port ${PORT}`);
  });
}

module.exports = app;
