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

/**
 * @openapi
 * /register:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Render register page
 *     responses:
 *       200:
 *         description: HTML page
 */
// Render pages
router.get("/register", (req, res) => {
  res.render("register.ejs", {
    title: "Register",
    error: req.flash("error"),
    success: req.flash("success"),
  });
});

/**
 * @openapi
 * /login:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Render login page
 *     responses:
 *       200:
 *         description: HTML page
 */
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
/**
 * @openapi
 * /register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       302:
 *         description: Redirects after registration
 */
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
/**
 * @openapi
 * /login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       302:
 *         description: Redirects after login
 */
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
/**
 * @openapi
 * /verify-email:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Verify email with token
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirects after verification
 */
router.get("/verify-email", verifyEmail);

module.exports = {
  router,
  getUsers,
  getVerificationTokens,
};
