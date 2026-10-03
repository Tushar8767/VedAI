const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const { isValidGmail, isValidPassword, normalizeEmail } = require('../utils/authValidators');
const config = require('../config');
const emailService = require('../services/emailService');

const generateToken = (userId, email, isGuest = false) => {
  return jwt.sign(
    { id: userId, email, isGuest },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_NAME',
        message: 'Name must be at least 2 characters long.'
      });
    }

    // 2. Validate Gmail requirement
    if (!isValidGmail(email)) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_EMAIL',
        message: 'Only valid Gmail addresses (e.g. yourname@gmail.com) are allowed.'
      });
    }

    // 3. Validate password length (min 8 chars)
    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_PASSWORD',
        message: 'Password must be at least 8 characters long.'
      });
    }

    const normalizedEmail = normalizeEmail(email);

    // 4. Duplicate prevention check
    const existing = await userRepository.findByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        errorCode: 'DUPLICATE_EMAIL',
        message: 'An account with this email already exists.'
      });
    }

    // 5. Hash password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 6. Create user in database (handles Mongo duplicate key gracefully)
    try {
      const user = await userRepository.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash
      });

      const token = generateToken(user._id, user.email);

      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          preferences: user.preferences
        }
      });
    } catch (dbErr) {
      if (dbErr.code === 11000 || dbErr.name === 'MongoServerError') {
        return res.status(409).json({
          success: false,
          errorCode: 'DUPLICATE_EMAIL',
          message: 'An account with this email already exists.'
        });
      }
      throw dbErr;
    }
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_CREDENTIALS',
        message: 'Email and password are required.'
      });
    }

    // 2. Validate Gmail format
    if (!isValidGmail(email)) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_EMAIL',
        message: 'Only valid Gmail addresses (e.g. yourname@gmail.com) are allowed.'
      });
    }

    const normalizedEmail = normalizeEmail(email);

    // 3. Find user in MongoDB
    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.'
      });
    }

    // 4. Compare password with stored hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.'
      });
    }

    // 5. Generate session token (never return passwordHash)
    const token = generateToken(user._id, user.email);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!isValidGmail(email)) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_EMAIL',
        message: 'Only valid Gmail addresses (e.g. yourname@gmail.com) are allowed.'
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await userRepository.findByEmail(normalizedEmail);

    // Always return safe generic response to prevent email enumeration
    const safeResponse = {
      success: true,
      message: 'If an account exists for this email, password reset instructions will be provided.'
    };

    if (!user) {
      return res.json(safeResponse);
    }

    // Generate cryptographically secure reset token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

    // Save hashed token to database (never the raw token)
    await userRepository.setResetToken(user._id, {
      tokenHash,
      expires
    });

    // Construct reset URL using configured FRONTEND_URL
    const baseUrl = (config.frontendUrl || config.clientUrl || 'http://localhost:5173').replace(/\/+$/, '');
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

    // Send email using Nodemailer service
    try {
      const emailResult = await emailService.sendPasswordResetEmail({
        toEmail: normalizedEmail,
        recipientName: user.name,
        resetUrl
      });

      // Strict production rule: In production (NODE_ENV=production), NEVER return reset token
      const isProduction = (process.env.NODE_ENV === 'production') || (config.env === 'production');
      if (!isProduction && !emailResult.delivered) {
        safeResponse.metadata = {
          devNotice: 'SMTP credentials not configured. In production, this email is sent via configured SMTP.',
          devResetToken: rawToken,
          resetUrl
        };
      }
    } catch (emailErr) {
      console.error('[ForgotPassword Error] Email delivery failed:', emailErr.message);
      // Invalidate token so user is not left with an unreceived active token
      await userRepository.setResetToken(user._id, {
        tokenHash: null,
        expires: null
      });
      return res.json(safeResponse);
    }

    return res.json(safeResponse);
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/verify-reset-token
const verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_TOKEN',
        message: 'Reset token is required.'
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await userRepository.findByResetToken(tokenHash);

    if (!user) {
      // Check if expired or used for precise helpful error
      const anyUserWithToken = await userRepository.findByRawResetTokenForAudit(tokenHash);
      if (anyUserWithToken) {
        if (anyUserWithToken.resetPasswordUsed) {
          return res.status(400).json({
            success: false,
            errorCode: 'TOKEN_ALREADY_USED',
            message: 'This password reset token has already been used. Please request a new one.'
          });
        }
        if (new Date(anyUserWithToken.resetPasswordExpires) <= new Date()) {
          return res.status(400).json({
            success: false,
            errorCode: 'TOKEN_EXPIRED',
            message: 'This password reset token has expired. Please request a new one.'
          });
        }
      }

      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_TOKEN',
        message: 'Password reset token is invalid or has expired.'
      });
    }

    return res.json({
      success: true,
      valid: true,
      message: 'Token is valid.'
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        errorCode: 'MISSING_TOKEN',
        message: 'Reset token is required.'
      });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_PASSWORD',
        message: 'New password must be at least 8 characters long.'
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await userRepository.findByResetToken(tokenHash);

    if (!user) {
      const anyUserWithToken = await userRepository.findByRawResetTokenForAudit(tokenHash);
      if (anyUserWithToken) {
        if (anyUserWithToken.resetPasswordUsed) {
          return res.status(400).json({
            success: false,
            errorCode: 'TOKEN_ALREADY_USED',
            message: 'This password reset token has already been used. Please request a new one.'
          });
        }
        if (new Date(anyUserWithToken.resetPasswordExpires) <= new Date()) {
          return res.status(400).json({
            success: false,
            errorCode: 'TOKEN_EXPIRED',
            message: 'This password reset token has expired. Please request a new one.'
          });
        }
      }

      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_TOKEN',
        message: 'Password reset token is invalid or has expired.'
      });
    }

    // Hash new password securely
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password in database and invalidate the token completely
    await userRepository.updatePasswordAndInvalidateToken(user._id, newPasswordHash);

    return res.json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    if (req.user.isGuest) {
      return res.json({
        success: true,
        isGuest: true,
        user: {
          name: 'Guest Traveler',
          email: null,
          preferences: { language: 'en', enableEmotionIntelligence: true, enableFacialAnalysisConsent: false }
        }
      });
    }

    const user = await userRepository.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        errorCode: 'USER_NOT_FOUND',
        message: 'User not found.'
      });
    }

    return res.json({
      success: true,
      isGuest: false,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/guest
const createGuestSession = (req, res) => {
  const guestSessionId = 'guest_' + Math.random().toString(36).substring(2, 12);
  const token = generateToken(guestSessionId, null, true);
  return res.json({
    success: true,
    isGuest: true,
    guestSessionId,
    token
  });
};

module.exports = {
  register,
  login,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  getMe,
  createGuestSession
};
