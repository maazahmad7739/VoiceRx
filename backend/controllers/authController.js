const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendResetEmail } = require('../services/emailService');

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

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { email }
    });

    // Security practice: do not leak if email exists or not
    const genericResponse = {
      message: 'If this email exists, an OTP has been sent.'
    };

    if (!doctor) {
      return res.status(200).json(genericResponse);
    }

    // Invalidate any active, unused OTP records for this doctor
    await prisma.passwordResetOtp.updateMany({
      where: { doctorId: doctor.id, used: false },
      data: { used: true }
    });

    // Generate a 6-digit numeric OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash raw OTP
    const otpHash = await bcrypt.hash(rawOtp, 10);

    // Save hashed OTP with 10 minutes expiry
    await prisma.passwordResetOtp.create({
      data: {
        doctorId: doctor.id,
        otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    console.log('\x1b[36m%s\x1b[0m', `[PASSWORD RESET OTP] For ${email}: ${rawOtp}`);

    // Trigger email send in background
    sendResetEmail(email, rawOtp).catch(err => {
      console.error('[EMAIL ERROR] Background email transmission failed:', err.message);
    });

    // Add demo OTP on dev/test for frontend helper prefilling
    if (process.env.NODE_ENV !== 'production') {
      genericResponse.demoOtp = rawOtp;
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Internal server error during password reset request.' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP code are required.' });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { email }
    });

    if (!doctor) {
      return res.status(400).json({ error: 'Invalid email or OTP.' });
    }

    // Find unused, non-expired OTPs for the doctor
    const activeOtps = await prisma.passwordResetOtp.findMany({
      where: {
        doctorId: doctor.id,
        used: false,
        expiresAt: { gt: new Date() }
      }
    });

    let matchedOtp = null;
    for (const record of activeOtps) {
      const isMatch = await bcrypt.compare(otp, record.otpHash);
      if (isMatch) {
        matchedOtp = record;
        break;
      }
    }

    if (!matchedOtp) {
      return res.status(400).json({ error: 'Invalid email or OTP.' });
    }

    // Generate signed, purpose-scoped reset token valid for 10 minutes
    const resetToken = jwt.sign(
      { doctorId: doctor.id, purpose: 'password_reset_session', otpId: matchedOtp.id },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    return res.status(200).json({
      message: 'OTP verified successfully.',
      resetToken
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ error: 'Internal server error during OTP verification.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset session token and new password are required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired reset session token.' });
    }

    if (!decoded || decoded.purpose !== 'password_reset_session' || !decoded.doctorId || !decoded.otpId) {
      return res.status(400).json({ error: 'Invalid or expired reset session token.' });
    }

    // Verify OTP record has not been used already
    const otpRecord = await prisma.passwordResetOtp.findUnique({
      where: { id: decoded.otpId }
    });

    if (!otpRecord || otpRecord.used) {
      return res.status(400).json({ error: 'Reset session has already been used or is invalid.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.doctor.update({
      where: { id: decoded.doctorId },
      data: { passwordHash }
    });

    // Mark the OTP record as used
    await prisma.passwordResetOtp.update({
      where: { id: decoded.otpId },
      data: { used: true }
    });

    return res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Internal server error during password reset.' });
  }
};

exports.getDemoAccounts = async (req, res) => {
  try {
    const doctors = await prisma.doctor.findMany({
      select: { email: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    return res.status(200).json({ emails: doctors.map(d => d.email) });
  } catch (error) {
    console.error('Get demo accounts error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
