const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // max 30 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    errorCode: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 6, // max 6 reset requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    errorCode: 'RESET_RATE_LIMIT_EXCEEDED',
    message: 'Too many password reset requests. Please check your inbox or try again after 15 minutes.'
  }
});

const reflectLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120, // max 120 reflection / orchestration requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    errorCode: 'REFLECT_RATE_LIMIT_EXCEEDED',
    message: 'Too many reflection requests. Please pause and take a mindful breath before continuing.'
  }
});

const telemetryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // max 150 telemetry submissions per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    errorCode: 'TELEMETRY_RATE_LIMIT_EXCEEDED',
    message: 'Too many telemetry events recorded. Please try again later.'
  }
});

module.exports = {
  authLimiter,
  passwordResetLimiter,
  reflectLimiter,
  telemetryLimiter
};
