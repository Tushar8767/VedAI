const {
  registerUser,
  loginUser,
  getUserById,
  deleteUserAccount,
  requestPasswordReset,
  resetPassword,
  changePassword
} = require("../services/authService");

function sendAuthError(res, error) {
  res.status(error.statusCode || 500).json({
    error: {
      code: error.statusCode === 409 ? "CONFLICT" : error.statusCode === 401 ? "UNAUTHORIZED" : "AUTH_ERROR",
      message: error.message || "Authentication failed."
    }
  });
}

async function register(req, res) {
  try {
    const result = await registerUser(req.body || {});
    res.status(201).json(result);
  } catch (error) {
    sendAuthError(res, error);
  }
}

async function login(req, res) {
  try {
    const result = await loginUser(req.body || {});
    res.json(result);
  } catch (error) {
    sendAuthError(res, error);
  }
}

async function currentUser(req, res) {
  const user = await getUserById(req.user.id);
  res.json({ user });
}

function logout(req, res) {
  res.json({ status: "ok" });
}

async function deleteAccount(req, res) {
  try {
    await deleteUserAccount(req.user.id);
    res.json({ status: "ok", message: "Account and associated data deleted successfully." });
  } catch (error) {
    sendAuthError(res, error);
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body || {};
    const result = await requestPasswordReset(email);
    res.json(result);
  } catch (error) {
    sendAuthError(res, error);
  }
}

async function handleResetPassword(req, res) {
  try {
    const { token, newPassword } = req.body || {};
    const result = await resetPassword({ token, newPassword });
    res.json(result);
  } catch (error) {
    sendAuthError(res, error);
  }
}

async function handleChangePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    const result = await changePassword({
      userId: req.user.id,
      currentPassword,
      newPassword
    });
    res.json(result);
  } catch (error) {
    sendAuthError(res, error);
  }
}

module.exports = {
  register,
  login,
  currentUser,
  logout,
  deleteAccount,
  forgotPassword,
  handleResetPassword,
  handleChangePassword
};
