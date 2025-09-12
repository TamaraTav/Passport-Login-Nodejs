const express = require("express");
const {
  registerValidation,
  loginValidation,
  handleValidationErrors,
} = require("../middleware/validation");
const { loginLimiter, registerLimiter } = require("../middleware/security");
const {
  register,
  login,
  logout,
  verifyEmail,
  getUsers,
  getVerificationTokens,
} = require("../controllers/authController");

const router = express.Router();

// Register route
router.post(
  "/register",
  registerLimiter,
  registerValidation,
  handleValidationErrors,
  register
);

// Login route
router.post(
  "/login",
  loginLimiter,
  loginValidation,
  handleValidationErrors,
  login
);

// Logout route
router.delete("/logout", logout);

// Email verification route
router.get("/verify-email", verifyEmail);

module.exports = {
  router,
  getUsers,
  getVerificationTokens,
};
