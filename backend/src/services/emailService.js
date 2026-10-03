const nodemailer = require('nodemailer');
const config = require('../config');

// Check if SMTP is configured in environment
const isEmailConfigured = () => {
  return Boolean(
    config.email.smtpHost &&
    config.email.smtpUser &&
    config.email.smtpPass
  );
};

// Create Nodemailer Transporter
const createTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.email.smtpHost,
    port: config.email.smtpPort,
    secure: config.email.smtpPort === 465, // true for 465, false for 587
    auth: {
      user: config.email.smtpUser,
      pass: config.email.smtpPass
    }
  });
};

/**
 * Send Password Reset Email
 * 
 * Rules:
 * - Never log raw reset token or credentials.
 * - Never include passwords or stack traces.
 * - Construct accessible HTML and plain-text formats.
 */
const sendPasswordResetEmail = async ({ toEmail, recipientName, resetUrl }) => {
  if (!isEmailConfigured()) {
    console.log(`[EmailService] SMTP not configured. Real inbox delivery requires valid SMTP_HOST, SMTP_USER, SMTP_PASS in environment.`);
    return {
      delivered: false,
      reason: 'SMTP_NOT_CONFIGURED'
    };
  }

  const transporter = createTransporter();
  const safeName = recipientName ? String(recipientName).replace(/[<>]/g, '') : 'Seeker';

  const mailOptions = {
    from: config.email.smtpFrom,
    to: toEmail,
    subject: 'VedAI — Password Reset Request',
    text: `Hello ${safeName},\n\nA password reset request was received for your VedAI account.\n\nPlease visit the link below to set a new password:\n${resetUrl}\n\nThis link will expire in 15 minutes and can only be used once.\n\nIf you did not request this password reset, please ignore this email. Your account remains secure.\n\nPeace and clarity,\nThe VedAI Team`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; color: #2C2724; margin: 0; padding: 20px; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #E8E1D5; border-radius: 16px; overflow: hidden; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { font-size: 32px; margin-bottom: 8px; }
          .title { font-size: 20px; font-weight: bold; color: #3A3026; margin: 0; font-family: Georgia, serif; }
          .content { font-size: 14px; line-height: 1.6; color: #574c43; margin-bottom: 28px; }
          .button-wrap { text-align: center; margin: 28px 0; }
          .button { display: inline-block; background-color: #b45309; color: #ffffff !important; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: 600; border-radius: 10px; }
          .notice { font-size: 12px; color: #8c7e72; line-height: 1.5; border-top: 1px solid #F0EAE1; padding-top: 16px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🕉️</div>
            <h1 class="title">VedAI Password Reset</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${safeName}</strong>,</p>
            <p>We received a request to reset the password for your VedAI account associated with <strong>${toEmail}</strong>.</p>
            <div class="button-wrap">
              <a href="${resetUrl}" class="button" target="_blank">Reset My Password</a>
            </div>
            <p style="font-size: 12px; color: #78716c;">If the button above does not work, copy and paste this link into your browser:<br><a href="${resetUrl}" style="color: #b45309; word-break: break-all;">${resetUrl}</a></p>
          </div>
          <div class="notice">
            <p><strong>Security Notice:</strong></p>
            <p>• This reset link is valid for <strong>15 minutes</strong> and can only be used once.<br>
            • If you did not initiate this request, you can safely ignore this email. Your current password remains secure.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Password reset email successfully delivered to ${toEmail}. MessageId: ${info.messageId}`);
    return {
      delivered: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error(`[EmailService Error] Failed delivering reset email to ${toEmail}:`, error.message);
    throw new Error('SMTP_DELIVERY_FAILED');
  }
};

module.exports = {
  sendPasswordResetEmail,
  isEmailConfigured
};
