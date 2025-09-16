const { sendPasswordResetEmail } = require("../services/emailService");
const User = require("../models/User");
const Token = require("../models/Token");
const { ValidationError, TokenError, EmailError } = require("../utils/errors");
const { catchAsync } = require("../middleware/errorHandler");

// Get resetTokens for routes
const getResetTokens = () => Token.getAllResetTokens();

// Forgot password controller
const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body || {};

  if (!email) {
    req.flash("error", "Email is required");
    return res.redirect("/forgot-password");
  }

  // Basic format check to align with tests
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    req.flash("error", "Please provide a valid email address");
    return res.redirect("/forgot-password");
  }

  // Find user by email using User model
  const user = User.findByEmail(email);

  if (!user) {
    req.flash("error", "No user with that email address");
    return res.redirect("/forgot-password");
  }

  // Generate reset token using Token model
  const resetToken = Token.createResetToken(user.id, user.email, 1); // 1 hour

  // Send reset email
  try {
    await sendPasswordResetEmail(email, resetToken.token);
    req.flash(
      "success",
      "Password reset instructions have been sent to your email"
    );
  } catch (emailError) {
    console.error("Email sending failed:", emailError);
    req.flash(
      "success",
      `Password reset link: http://localhost:3002/reset-password?token=${resetToken.token}`
    );
  }

  return res.redirect("/forgot-password");
});

// Reset password controller
const resetPassword = catchAsync(async (req, res, next) => {
  const token = (req.query && req.query.token) || (req.body && req.body.token);
  const { password, confirmPassword } = req.body || {};

  if (!token) {
    req.flash("error", "Reset token is required");
    return res.redirect("/forgot-password");
  }

  if (token && (!password || !confirmPassword)) {
    req.flash("error", "Password and confirmation are required");
    return res.redirect(`/reset-password?token=${encodeURIComponent(token)}`);
  }

  if (token && password !== confirmPassword) {
    req.flash("error", "Passwords do not match");
    return res.redirect(`/reset-password?token=${encodeURIComponent(token)}`);
  }

  // Basic strength check to align with validation expectations
  if (token && password.length < 8) {
    req.flash("error", "Password must be at least 8 characters long");
    return res.redirect(`/reset-password?token=${encodeURIComponent(token)}`);
  }

  // Find reset token using Token model
  const tokenData = Token.findResetToken(token);

  if (!tokenData) {
    req.flash("error", "Invalid or expired reset token");
    return res.redirect("/forgot-password");
  }

  // Find user using User model
  const user = User.findById(tokenData.userId);

  if (!user) {
    req.flash("error", "User not found");
    return res.redirect("/forgot-password");
  }

  // Update user password using User model
  await User.updatePassword(user.id, password);

  // Remove used token
  Token.deleteResetToken(token);

  req.flash(
    "success",
    "Password has been reset successfully. You can now log in with your new password."
  );
  return res.redirect("/login");
});

module.exports = {
  forgotPassword,
  resetPassword,
  getResetTokens,
};
