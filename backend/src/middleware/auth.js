const jwt = require('jsonwebtoken');
const config = require('../config');

// Protect routes - requires valid registered user token
const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please log in to access this feature.'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token.'
    });
  }
};

// Optional auth - permits guest exploration while identifying registered users if present
const optionalAuth = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;
      return next();
    } catch (err) {
      // Token invalid, fall back to guest
    }
  }

  // Guest user session
  req.user = {
    isGuest: true,
    sessionId: req.headers['x-guest-session-id'] || 'guest_session'
  };
  next();
};

// Extract user ID safely from request without throwing if unauthenticated
const getUserIdFromRequest = (req) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    return decoded?.id || null;
  } catch {
    return null;
  }
};

module.exports = {
  protect,
  optionalAuth,
  getUserIdFromRequest
};
