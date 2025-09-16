const express = require("express");
const {
  forgotPassword,
  resetPassword,
  getResetTokens,
} = require("../controllers/passwordController");

const router = express.Router();
// Ensure JSON bodies are parsed for Supertest-based JSON requests
router.use(express.json());

/**
 * @openapi
 * /forgot-password:
 *   get:
 *     tags:
 *       - Password
 *     summary: Render forgot password page
 *     responses:
 *       200:
 *         description: HTML page
 */
// Forgot password page
router.get("/forgot-password", (req, res) => {
  res.render("forgot-password.ejs", {
    title: "Forgot Password",
    error: req.flash("error"),
    success: req.flash("success"),
  });
});

/**
 * @openapi
 * /forgot-password:
 *   post:
 *     tags:
 *       - Password
 *     summary: Submit forgot password request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       302:
 *         description: Redirects back to forgot-password
 */
// Forgot password form submission
router.post(
  "/forgot-password",
  (req, res, next) => {
    // If Content-Type is not form or json, treat as malformed
    const contentType = req.headers["content-type"] || "";
    if (
      contentType &&
      !contentType.includes("application/x-www-form-urlencoded") &&
      !contentType.includes("application/json")
    ) {
      return res.status(400).send("Bad Request");
    }
    // If urlencoded but parser produced empty body while content-length > 0, treat as malformed
    if (
      contentType.includes("application/x-www-form-urlencoded") &&
      req.body &&
      (Object.keys(req.body).length === 0 ||
        Object.values(req.body).every((v) => v === ""))
    ) {
      return res.status(400).send("Bad Request");
    }
    next();
  },
  forgotPassword
);

/**
 * @openapi
 * /reset-password:
 *   get:
 *     tags:
 *       - Password
 *     summary: Render reset password page
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: HTML page
 */
// Reset password page
router.get("/reset-password", (req, res) => {
  const { token } = req.query;

  if (!token) {
    req.flash("error", "Invalid reset link");
    return res.redirect("/forgot-password");
  }

  res.render("reset-password.ejs", {
    title: "Reset Password",
    token: token,
    error: req.flash("error"),
    success: req.flash("success"),
  });
});

/**
 * @openapi
 * /reset-password:
 *   post:
 *     tags:
 *       - Password
 *     summary: Submit new password with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       302:
 *         description: Redirects after reset
 */
// Reset password form submission
router.post("/reset-password", resetPassword);

module.exports = {
  router,
  getResetTokens,
};
