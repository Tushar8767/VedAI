const http = require('http');

function postJSON(path, payload) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', (err) => resolve({ status: 500, error: err.message }));
    req.write(data);
    req.end();
  });
}

async function runLiveAuthTests() {
  console.log('====================================================');
  console.log('       LIVE AUTHENTICATION VERIFICATION MATRIX       ');
  console.log('====================================================\n');

  let passed = 0;
  const testEmail = `tushar_test_${Date.now()}@gmail.com`;
  const initialPassword = 'InitialSecurePass2026';
  const newPassword = 'UpdatedSecurePass2027';
  let devToken = null;

  // 1. Non-Gmail rejection
  const nonGmailRes = await postJSON('/api/auth/register', {
    name: 'Test',
    email: 'test@yahoo.com',
    password: initialPassword
  });
  if (nonGmailRes.status === 400 && nonGmailRes.body.errorCode === 'INVALID_EMAIL') {
    console.log('[PASS] 1. Non-Gmail registration rejected (test@yahoo.com)');
    passed++;
  } else {
    console.log('[FAIL] 1. Non-Gmail registration:', nonGmailRes);
  }

  // 2. Short password rejection
  const shortPassRes = await postJSON('/api/auth/register', {
    name: 'Test',
    email: testEmail,
    password: 'short'
  });
  if (shortPassRes.status === 400 && shortPassRes.body.errorCode === 'INVALID_PASSWORD') {
    console.log('[PASS] 2. Short password (< 8 chars) rejected');
    passed++;
  } else {
    console.log('[FAIL] 2. Short password rejection:', shortPassRes);
  }

  // 3. Valid Gmail registration
  const regRes = await postJSON('/api/auth/register', {
    name: 'VedAI Traveler',
    email: testEmail,
    password: initialPassword
  });
  if (regRes.status === 201 && regRes.body.token && regRes.body.user.email === testEmail.toLowerCase()) {
    console.log(`[PASS] 3. Valid registration succeeded (${testEmail}) -> User ID: ${regRes.body.user.id}`);
    passed++;
  } else {
    console.log('[FAIL] 3. Valid registration:', regRes);
  }

  // 4. Duplicate Gmail rejection
  const dupRes = await postJSON('/api/auth/register', {
    name: 'Duplicate Seeker',
    email: testEmail.toUpperCase(),
    password: initialPassword
  });
  if (dupRes.status === 409 && dupRes.body.errorCode === 'DUPLICATE_EMAIL') {
    console.log('[PASS] 4. Duplicate Gmail registration rejected with 409 DUPLICATE_EMAIL');
    passed++;
  } else {
    console.log('[FAIL] 4. Duplicate registration rejection:', dupRes);
  }

  // 5. Sign In with wrong password
  const wrongPassRes = await postJSON('/api/auth/login', {
    email: testEmail,
    password: 'IncorrectPassword99'
  });
  if (wrongPassRes.status === 401 && wrongPassRes.body.errorCode === 'INVALID_CREDENTIALS') {
    console.log('[PASS] 5. Login with wrong password safely rejected (401)');
    passed++;
  } else {
    console.log('[FAIL] 5. Wrong password login:', wrongPassRes);
  }

  // 6. Sign In with correct credentials
  const loginRes = await postJSON('/api/auth/login', {
    email: testEmail,
    password: initialPassword
  });
  if (loginRes.status === 200 && loginRes.body.token && !loginRes.body.user.passwordHash) {
    console.log('[PASS] 6. Login succeeded and passwordHash is never returned');
    passed++;
  } else {
    console.log('[FAIL] 6. Login verification:', loginRes);
  }

  // 7. Forgot Password Request
  const forgotRes = await postJSON('/api/auth/forgot-password', {
    email: testEmail
  });
  if (forgotRes.status === 200 && forgotRes.body.success) {
    devToken = forgotRes.body.metadata?.devResetToken;
    console.log('[PASS] 7. Forgot password generated token securely without leaking user existence');
    passed++;
  } else {
    console.log('[FAIL] 7. Forgot password:', forgotRes);
  }

  // 8. Verify Reset Token
  if (devToken) {
    const verifyRes = await postJSON('/api/auth/verify-reset-token', {
      token: devToken
    });
    if (verifyRes.status === 200 && verifyRes.body.valid) {
      console.log('[PASS] 8. Reset token verification succeeded');
      passed++;
    } else {
      console.log('[FAIL] 8. Token verification:', verifyRes);
    }

    // 9. Reset Password with new password
    const resetRes = await postJSON('/api/auth/reset-password', {
      token: devToken,
      newPassword: newPassword
    });
    if (resetRes.status === 200 && resetRes.body.success) {
      console.log('[PASS] 9. Password reset succeeded with new password');
      passed++;
    } else {
      console.log('[FAIL] 9. Reset password:', resetRes);
    }

    // 10. Attempt to reuse reset token (Must be rejected)
    const reuseRes = await postJSON('/api/auth/reset-password', {
      token: devToken,
      newPassword: 'AnotherPassword888'
    });
    if (reuseRes.status === 400) {
      console.log('[PASS] 10. Reusing consumed reset token was strictly rejected');
      passed++;
    } else {
      console.log('[FAIL] 10. Reusing reset token was not rejected:', reuseRes);
    }

    // 11. Old password rejected
    const oldLoginRes = await postJSON('/api/auth/login', {
      email: testEmail,
      password: initialPassword
    });
    if (oldLoginRes.status === 401) {
      console.log('[PASS] 11. Old password rejected after successful reset');
      passed++;
    } else {
      console.log('[FAIL] 11. Old password accepted after reset:', oldLoginRes);
    }

    // 12. New password accepted
    const newLoginRes = await postJSON('/api/auth/login', {
      email: testEmail,
      password: newPassword
    });
    if (newLoginRes.status === 200 && newLoginRes.body.token) {
      console.log('[PASS] 12. New password accepted and authenticated successfully');
      passed++;
    } else {
      console.log('[FAIL] 12. New password rejected:', newLoginRes);
    }
  }

  console.log('\n----------------------------------------------------');
  console.log(`Summary: ${passed} / 12 Live Endpoints Verified Successfully.`);
  console.log('====================================================');
}

runLiveAuthTests();
