const express = require("express");
const bcrypt = require("bcrypt");
const {
  generateTokenWithExpiry,
  isTokenExpired,
  hashToken,
} = require("../utils/tokenUtils");
const { sendPasswordResetEmail } = require("../services/emailService");
const { validatePasswordStrength } = require("../middleware/validation");

const router = express.Router();

// In-memory storage for reset tokens (temporary - will be replaced with database)
const resetTokens = new Map();

// Forgot password page
router.get("/forgot-password", (req, res) => {
  res.render("forgot-password.ejs", {
    title: "Forgot Password",
    error: req.flash("error"),
    success: req.flash("success"),
  });
});

// Forgot password form submission
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      req.flash("error", "Please enter your email address");
      return res.redirect("/forgot-password");
    }

    // In a real app, you would check if user exists in database
    // For now, we'll assume user exists and always send reset email
    console.log(`Password reset requested for: ${email}`);

    // Generate reset token
    const tokenData = generateTokenWithExpiry(1); // 1 hour expiry
    const hashedToken = hashToken(tokenData.token);

    resetTokens.set(hashedToken, {
      email: email,
      expiresAt: tokenData.expiresAt,
    });

    // Send password reset email
    try {
      await sendPasswordResetEmail(email, tokenData.token);
      req.flash("success", "Password reset link sent to your email");
    } catch (emailError) {
      console.error("Password reset email failed:", emailError);
      req.flash(
        "error",
        "Failed to send password reset email. Please try again."
      );
    }

    res.redirect("/forgot-password");
  } catch (error) {
    console.error("Forgot password error:", error);
    req.flash("error", "An error occurred. Please try again.");
    res.redirect("/forgot-password");
  }
});

// Reset password page
router.get("/reset-password", (req, res) => {
  const { token } = req.query;

  if (!token) {
    req.flash("error", "Invalid reset link");
    return res.redirect("/forgot-password");
  }

  const hashedToken = hashToken(token);
  const tokenData = resetTokens.get(hashedToken);

  if (!tokenData) {
    req.flash("error", "Invalid or expired reset link");
    return res.redirect("/forgot-password");
  }

  if (isTokenExpired(tokenData.expiresAt)) {
    resetTokens.delete(hashedToken);
    req.flash("error", "Reset link has expired. Please request a new one.");
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
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      req.flash("error", "All fields are required");
      return res.redirect(`/reset-password?token=${token}`);
    }

    if (password !== confirmPassword) {
      req.flash("error", "Passwords do not match");
      return res.redirect(`/reset-password?token=${token}`);
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      req.flash("error", passwordValidation.message);
      return res.redirect(`/reset-password?token=${token}`);
    }

    const hashedToken = hashToken(token);
    const tokenData = resetTokens.get(hashedToken);

    if (!tokenData) {
      req.flash("error", "Invalid or expired reset link");
      return res.redirect("/forgot-password");
    }

    if (isTokenExpired(tokenData.expiresAt)) {
      resetTokens.delete(hashedToken);
      req.flash("error", "Reset link has expired. Please request a new one.");
      return res.redirect("/forgot-password");
    }

    // In a real app, you would update the user's password in the database
    // For now, we'll just log the success
    console.log(`Password reset successful for: ${tokenData.email}`);

    // Delete the used token
    resetTokens.delete(hashedToken);

    req.flash(
      "success",
      "Password reset successful! You can now log in with your new password."
    );
    res.redirect("/login");
  } catch (error) {
    console.error("Reset password error:", error);
    req.flash("error", "Password reset failed. Please try again.");
    res.redirect("/forgot-password");
  }
});

module.exports = { router, resetTokens };
