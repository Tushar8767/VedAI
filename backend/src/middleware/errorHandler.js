const config = require('../config');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);

  const response = {
    success: false,
    message: err.message || 'An unexpected error occurred in VedAI',
  };

  // Only expose sanitized stack trace in development, never in production
  if (config.env === 'development' && err.stack) {
    response.debug = {
      name: err.name,
      details: err.details || null
    };
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
