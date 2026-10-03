/**
 * Authentication Validators for VedAI 2.0
 * 
 * Rules:
 * 1. Only Gmail addresses are allowed (example@gmail.com).
 * 2. Passwords must be at least 8 characters long.
 * 3. Normalizes email to trimmed lowercase.
 */

const GMAIL_REGEX = /^[a-zA-Z0-9](\.?[a-zA-Z0-9_-])*@gmail\.com$/i;

const isValidGmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  return GMAIL_REGEX.test(trimmed);
};

const isValidPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 8;
};

const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

module.exports = {
  isValidGmail,
  isValidPassword,
  normalizeEmail,
  GMAIL_REGEX
};
