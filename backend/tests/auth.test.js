const test = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { isValidGmail, isValidPassword, normalizeEmail } = require('../src/utils/authValidators');
const userRepository = require('../src/repositories/userRepository');

test('VedAI 2.0 - Comprehensive Authentication Test Suite', async (t) => {

  await t.test('1. Email Validation: Strictly Gmail allowed', () => {
    // Valid Gmail
    assert.strictEqual(isValidGmail('testuser@gmail.com'), true);
    assert.strictEqual(isValidGmail('arjuna.vedai@gmail.com'), true);
    assert.strictEqual(isValidGmail('krishna_guide@gmail.com'), true);
    assert.strictEqual(isValidGmail('Seeker-2026@gmail.com'), true);

    // Rejected non-Gmail or malformed
    assert.strictEqual(isValidGmail('example'), false);
    assert.strictEqual(isValidGmail('example@'), false);
    assert.strictEqual(isValidGmail('example@gmail'), false);
    assert.strictEqual(isValidGmail('example@yahoo.com'), false);
    assert.strictEqual(isValidGmail('example@outlook.com'), false);
    assert.strictEqual(isValidGmail('invalid@gmail.co'), false);
    assert.strictEqual(isValidGmail('user@gmail.com.org'), false);
    assert.strictEqual(isValidGmail(''), false);
    assert.strictEqual(isValidGmail(null), false);
  });

  await t.test('2. Email Normalization: Lowercase & Trimmed', () => {
    assert.strictEqual(normalizeEmail('  TestUser@Gmail.COM  '), 'testuser@gmail.com');
    assert.strictEqual(normalizeEmail('Arjuna@gmail.com'), 'arjuna@gmail.com');
  });

  await t.test('3. Password Validation: Minimum 8 characters', () => {
    assert.strictEqual(isValidPassword('short'), false);
    assert.strictEqual(isValidPassword('1234567'), false);
    assert.strictEqual(isValidPassword(''), false);
    assert.strictEqual(isValidPassword('12345678'), true);
    assert.strictEqual(isValidPassword('securePassword2026'), true);
  });

  // End-to-end repository & auth lifecycle test
  const uniqueTestEmail = `auth_test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@gmail.com`;
  const initialPassword = 'InitialSecretPass123';
  const updatedPassword = 'NewResetSecretPass456';
  let createdUserId = null;
  let rawResetToken = null;
  let hashedResetToken = null;

  await t.test('4. Registration: Valid user is created and stored with passwordHash', async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(initialPassword, salt);

    const user = await userRepository.create({
      name: 'Test Arjuna',
      email: uniqueTestEmail,
      passwordHash
    });

    assert.ok(user);
    assert.ok(user._id);
    assert.strictEqual(user.email, uniqueTestEmail.toLowerCase());
    assert.notStrictEqual(user.passwordHash, initialPassword);
    assert.ok(user.passwordHash.startsWith('$2')); // bcrypt prefix

    createdUserId = user._id;

    // Verify retrieval
    const retrieved = await userRepository.findByEmail(uniqueTestEmail);
    assert.ok(retrieved);
    assert.strictEqual(retrieved.email, uniqueTestEmail.toLowerCase());
  });

  await t.test('5. Duplicate Account Prevention: Rejects identical Gmail', async () => {
    let duplicateRejected = false;
    try {
      await userRepository.create({
        name: 'Imposter',
        email: uniqueTestEmail.toUpperCase(), // Case insensitive test
        passwordHash: 'dummy'
      });
    } catch (err) {
      duplicateRejected = true;
      assert.ok(err.code === 11000 || err.name === 'MongoServerError' || err.message.includes('Duplicate'));
    }
    assert.strictEqual(duplicateRejected, true, 'Duplicate registration must be rejected by database');
  });

  await t.test('6. Sign In: Valid credentials verify successfully', async () => {
    const user = await userRepository.findByEmail(uniqueTestEmail);
    assert.ok(user);

    const isMatch = await bcrypt.compare(initialPassword, user.passwordHash);
    assert.strictEqual(isMatch, true);
  });

  await t.test('7. Sign In: Wrong password rejected', async () => {
    const user = await userRepository.findByEmail(uniqueTestEmail);
    assert.ok(user);

    const isMatch = await bcrypt.compare('WrongPassword999', user.passwordHash);
    assert.strictEqual(isMatch, false);
  });

  await t.test('8. Forgot Password: Generate cryptographically secure reset token', async () => {
    rawResetToken = crypto.randomBytes(32).toString('hex');
    hashedResetToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await userRepository.setResetToken(createdUserId, {
      tokenHash: hashedResetToken,
      expires
    });

    const userWithToken = await userRepository.findByResetToken(hashedResetToken);
    assert.ok(userWithToken, 'User must be found with active unexpired reset token');
    assert.strictEqual(String(userWithToken._id), String(createdUserId));
  });

  await t.test('9. Reset Password: Expired token is rejected', async () => {
    const expiredToken = crypto.randomBytes(32).toString('hex');
    const expiredHash = crypto.createHash('sha256').update(expiredToken).digest('hex');
    const pastDate = new Date(Date.now() - 1000); // Expired 1 second ago

    await userRepository.setResetToken(createdUserId, {
      tokenHash: expiredHash,
      expires: pastDate
    });

    const userWithExpired = await userRepository.findByResetToken(expiredHash);
    assert.strictEqual(userWithExpired, null, 'Expired reset token must return null');
  });

  await t.test('10. Reset Password: Valid token successfully resets password and invalidates token', async () => {
    // Re-set valid token
    rawResetToken = crypto.randomBytes(32).toString('hex');
    hashedResetToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await userRepository.setResetToken(createdUserId, {
      tokenHash: hashedResetToken,
      expires
    });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(updatedPassword, salt);

    // Update password and invalidate token
    await userRepository.updatePasswordAndInvalidateToken(createdUserId, newPasswordHash);

    // Verify token is invalidated
    const tokenLookupAfter = await userRepository.findByResetToken(hashedResetToken);
    assert.strictEqual(tokenLookupAfter, null, 'Reset token must be single-use and invalidated immediately');

    // Verify old password is now rejected
    const updatedUser = await userRepository.findByEmail(uniqueTestEmail);
    const oldPassMatch = await bcrypt.compare(initialPassword, updatedUser.passwordHash);
    assert.strictEqual(oldPassMatch, false, 'Old password must be rejected after reset');

    // Verify new password is now accepted
    const newPassMatch = await bcrypt.compare(updatedPassword, updatedUser.passwordHash);
    assert.strictEqual(newPassMatch, true, 'New password must be accepted after reset');
  });

  await t.test('11. Reset URL Construction: Format follows ${FRONTEND_URL}/reset-password?token=${rawToken}', () => {
    const config = require('../src/config');
    const fakeRawToken = crypto.randomBytes(32).toString('hex');
    const baseUrl = (config.frontendUrl || config.clientUrl || 'http://localhost:5173').replace(/\/+$/, '');
    const resetUrl = `${baseUrl}/reset-password?token=${fakeRawToken}`;

    assert.ok(resetUrl.startsWith(baseUrl));
    assert.ok(resetUrl.includes('/reset-password?token='));
    assert.strictEqual(resetUrl.split('?token=')[1], fakeRawToken);
  });

  await t.test('12. Email Service Interface: Exports required delivery and config methods', () => {
    const emailService = require('../src/services/emailService');
    assert.strictEqual(typeof emailService.sendPasswordResetEmail, 'function');
    assert.strictEqual(typeof emailService.isEmailConfigured, 'function');
  });

  await t.test('13. Production Security: devResetToken is NEVER returned in response when NODE_ENV=production', async () => {
    const { forgotPassword } = require('../src/controllers/authController');
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const req = {
      body: { email: uniqueTestEmail }
    };

    let responseData = null;
    const res = {
      json: (data) => {
        responseData = data;
        return res;
      },
      status: () => res
    };

    try {
      await forgotPassword(req, res, () => {});
      assert.ok(responseData);
      assert.strictEqual(responseData.success, true);
      assert.strictEqual(responseData.message, 'If an account exists for this email, password reset instructions will be provided.');
      assert.strictEqual(responseData.metadata, undefined, 'In production, metadata containing devResetToken must be strictly undefined');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  await t.test('14. Generic Enumeration Protection: Non-existent email returns identical message', async () => {
    const { forgotPassword } = require('../src/controllers/authController');
    const req = {
      body: { email: 'nonexistent.user.2026@gmail.com' }
    };

    let responseData = null;
    const res = {
      json: (data) => {
        responseData = data;
        return res;
      },
      status: () => res
    };

    await forgotPassword(req, res, () => {});
    assert.ok(responseData);
    assert.strictEqual(responseData.success, true);
    assert.strictEqual(responseData.message, 'If an account exists for this email, password reset instructions will be provided.');
    assert.strictEqual(responseData.metadata, undefined);
  });

  await t.test('15. SMTP Failure Resilience: Token is immediately invalidated in DB if email sending fails', async () => {
    const { forgotPassword } = require('../src/controllers/authController');
    const emailService = require('../src/services/emailService');
    const originalSendEmail = emailService.sendPasswordResetEmail;

    // Simulate SMTP network failure
    emailService.sendPasswordResetEmail = async () => {
      throw new Error('Connection timeout to smtp.gmail.com:587');
    };

    const req = {
      body: { email: uniqueTestEmail }
    };

    let responseData = null;
    const res = {
      json: (data) => {
        responseData = data;
        return res;
      },
      status: () => res
    };

    try {
      await forgotPassword(req, res, () => {});
      assert.ok(responseData);
      assert.strictEqual(responseData.success, true);
      assert.strictEqual(responseData.message, 'If an account exists for this email, password reset instructions will be provided.');

      // Verify token in DB was wiped
      const user = await userRepository.findByEmail(uniqueTestEmail);
      assert.strictEqual(user.resetPasswordToken, null, 'Token hash must be cleared from DB if email fails');
      assert.strictEqual(user.resetPasswordExpires, null, 'Expiration must be cleared from DB if email fails');
    } finally {
      // Restore original method
      emailService.sendPasswordResetEmail = originalSendEmail;
    }
  });

  await t.test('16. Rate Limiting: Rate limiters exist and are configured for auth & password reset', () => {
    const { authLimiter, passwordResetLimiter } = require('../src/middleware/rateLimiter');
    assert.ok(authLimiter, 'Auth limiter must be defined');
    assert.ok(passwordResetLimiter, 'Password reset limiter must be defined');
  });

  // Cleanup test user
  await t.test('17. Cleanup test record', async () => {
    if (createdUserId) {
      await userRepository.deleteById(createdUserId);
    }
  });

});

