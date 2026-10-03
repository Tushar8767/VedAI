const express = require('express');
const router = express.Router();
const {
  register,
  login,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  getMe,
  createGuestSession
} = require('../controllers/authController');
const { optionalAuth } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/verify-reset-token', passwordResetLimiter, verifyResetToken);
router.post('/reset-password', passwordResetLimiter, resetPassword);
router.get('/me', optionalAuth, getMe);
router.get('/guest', createGuestSession);

module.exports = router;
