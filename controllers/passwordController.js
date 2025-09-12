const { sendPasswordResetEmail } = require("../services/emailService");
const User = require("../models/User");
const Token = require("../models/Token");
const { ValidationError, TokenError, EmailError } = require("../utils/errors");
const { catchAsync } = require("../middleware/errorHandler");

// Get resetTokens for routes
const getResetTokens = () => Token.getAllResetTokens();

// Forgot password controller
const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  // Find user by email using User model
  const user = User.findByEmail(email);

  if (!user) {
    return next(new ValidationError("No user with that email address"));
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

  res.redirect("/forgot-password");
});

// Reset password controller
const resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.query;
  const { password } = req.body;

  if (!token) {
    return next(new TokenError("Reset token is required"));
  }

  // Find reset token using Token model
  const tokenData = Token.findResetToken(token);

  if (!tokenData) {
    return next(new TokenError("Invalid or expired reset token"));
  }

  // Find user using User model
  const user = User.findById(tokenData.userId);

  if (!user) {
    return next(new ValidationError("User not found"));
  }

  // Update user password using User model
  await User.updatePassword(user.id, password);

  // Remove used token
  Token.deleteResetToken(token);

  req.flash(
    "success",
    "Password has been reset successfully. You can now log in with your new password."
  );
  res.redirect("/login");
});

module.exports = {
  forgotPassword,
  resetPassword,
  getResetTokens,
};
