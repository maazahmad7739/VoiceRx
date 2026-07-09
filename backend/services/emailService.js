const nodemailer = require('nodemailer');

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  // 1. If SMTP environment variables are configured, use them
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log('[EMAIL] Using configured production SMTP transporter.');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  // 2. Fallback to auto-generated Ethereal test email account
  console.log('[EMAIL] SMTP not configured. Creating temporary Ethereal test account...');
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[EMAIL] Ethereal test account created successfully: ${testAccount.user}`);
    return transporter;
  } catch (err) {
    console.error('[EMAIL] Failed to create Ethereal test account:', err.message);
    return null;
  }
}

exports.sendResetEmail = async (email, token) => {
  const activeTransporter = await getTransporter();
  if (!activeTransporter) {
    console.warn(`[EMAIL] Transporter unavailable. Intercepted reset code for ${email}: ${token}`);
    return null;
  }

  const fromAddress = process.env.SMTP_FROM || `"VoiceRx Portal" <no-reply@voicerx.in>`;

  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: 'VoiceRx Password Reset Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; padding: 12px; background-color: #ecfdf5; border-radius: 12px; color: #10b981; font-weight: bold; border: 1px solid #d1fae5;">
            VoiceRx Portal
          </div>
        </div>
        <h2 style="color: #0f172a; text-align: center; font-size: 20px; margin-top: 0;">Reset Your Password</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.5; text-align: center;">
          We received a request to recover your account. Use the following 6-digit verification code to complete your password reset:
        </p>
        <div style="background-color: #f1f5f9; border-radius: 12px; padding: 15px; text-align: center; margin: 25px 0; border: 1px solid #e2e8f0;">
          <span style="font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #059669; font-family: monospace; display: block;">
            ${token}
          </span>
        </div>
        <p style="font-size: 12px; color: #64748b; text-align: center; margin-bottom: 0; line-height: 1.4;">
          This verification code will expire in 1 hour. <br/>
          If you did not request this password change, please ignore this email.
        </p>
      </div>
    `,
  };

  try {
    const info = await activeTransporter.sendMail(mailOptions);
    console.log(`[EMAIL] Message sent to ${email}. Message ID: ${info.messageId}`);
    
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EMAIL] Ethereal Preview URL: ${previewUrl}`);
      return previewUrl;
    }
    return true;
  } catch (err) {
    console.error(`[EMAIL] Failed to send email to ${email}:`, err.message);
    return null;
  }
};
