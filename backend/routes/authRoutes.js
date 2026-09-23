const express = require("express");
const {
  register,
  login,
  currentUser,
  logout,
  deleteAccount,
  forgotPassword,
  handleResetPassword,
  handleChangePassword
} = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/api/v1/auth/register", register);
router.post("/api/v1/auth/login", login);
router.get("/api/v1/auth/me", requireAuth, currentUser);
router.post("/api/v1/auth/logout", requireAuth, logout);
router.delete("/api/v1/auth/account", requireAuth, deleteAccount);
router.post("/api/v1/auth/forgot-password", forgotPassword);
router.post("/api/v1/auth/reset-password", handleResetPassword);
router.post("/api/v1/auth/change-password", requireAuth, handleChangePassword);

module.exports = router;
