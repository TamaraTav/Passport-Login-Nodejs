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
// Parse JSON bodies for tests using Supertest
router.use(express.json());

// Render pages
router.get("/register", (req, res) => {
  res.render("register.ejs", {
    title: "Register",
    error: req.flash("error"),
    success: req.flash("success"),
  });
});

router.get("/login", (req, res) => {
  res.render("login.ejs", {
    title: "Login",
    error: req.flash("error"),
    success: req.flash("success"),
  });
});

// Helper to conditionally apply limiter in non-test env
const maybeRegisterLimiter =
  process.env.NODE_ENV === "test"
    ? (req, res, next) => next()
    : registerLimiter;

// Register route
router.post(
  "/register",
  maybeRegisterLimiter,
  registerValidation,
  handleValidationErrors,
  register
);

// Helper to conditionally apply limiter in non-test env
const maybeLoginLimiter =
  process.env.NODE_ENV === "test" ? (req, res, next) => next() : loginLimiter;

// Login route
router.post(
  "/login",
  maybeLoginLimiter,
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
