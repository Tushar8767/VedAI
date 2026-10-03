require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/vedai',
  jwt: {
    secret: process.env.JWT_SECRET || 'vedai-dev-secret-key-fallback-never-use-in-prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  mlService: {
    url: process.env.MODEL_API_URL || 'http://localhost:8001/predict',
    timeoutMs: parseInt(process.env.MODEL_TIMEOUT_MS || '10000', 10)
  },
  youtube: {
    apiKey: process.env.YOU_TUBE_API || ''
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  frontendUrl: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',
  email: {
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    smtpFrom: process.env.SMTP_FROM || 'VedAI <noreply@vedai.org>'
  }
};

module.exports = config;
