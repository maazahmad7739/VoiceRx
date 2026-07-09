const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

exports.signup = async (req, res) => {
  try {
    const { name, specialization, clinic_name, phone, email, password } = req.body;

    if (!name || !specialization || !clinic_name || !phone || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check if email already exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { email }
    });

    if (existingDoctor) {
      return res.status(400).json({ error: 'A doctor with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create doctor
    const doctor = await prisma.doctor.create({
      data: {
        name,
        specialization,
        clinicName: clinic_name,
        phone,
        email,
        passwordHash
      }
    });

    // Generate JWT token
    const token = jwt.sign({ id: doctor.id }, JWT_SECRET, { expiresIn: '7d' });

    // Respond (omit password hash)
    return res.status(201).json({
      token,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
        clinic_name: doctor.clinicName,
        phone: doctor.phone
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find doctor
    const doctor = await prisma.doctor.findUnique({
      where: { email }
    });

    if (!doctor) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, doctor.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: doctor.id }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      token,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
        clinic_name: doctor.clinicName,
        phone: doctor.phone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.doctor.id }
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found.' });
    }

    return res.status(200).json({
      doctor: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
        clinic_name: doctor.clinicName,
        phone: doctor.phone
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
