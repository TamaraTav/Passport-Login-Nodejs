const express = require("express");
const { validatePasswordStrength } = require("../middleware/validation");
const {
  forgotPassword,
  resetPassword,
  getResetTokens,
} = require("../controllers/passwordController");

const router = express.Router();

// Forgot password page
router.get("/forgot-password", (req, res) => {
  res.render("forgot-password.ejs", {
    title: "Forgot Password",
    error: req.flash("error"),
    success: req.flash("success"),
  });
});

// Forgot password form submission
router.post("/forgot-password", forgotPassword);

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

// Reset password form submission
router.post("/reset-password", resetPassword);

module.exports = {
  router,
  getResetTokens,
};
