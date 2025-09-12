const bcrypt = require("bcrypt");
const { sendPasswordResetEmail } = require("../services/emailService");
const {
  generateTokenWithExpiry,
  isTokenExpired,
  hashToken,
} = require("../utils/tokenUtils");

// In-memory storage for reset tokens (in production, use database)
let resetTokens = new Map();

// Get resetTokens for routes
const getResetTokens = () => resetTokens;

// Forgot password controller
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const users = require("./authController").getUsers();
    const user = users.find((u) => u.email === email);

    if (!user) {
      req.flash("error", "No user with that email address");
      return res.redirect("/forgot-password");
    }

    // Generate reset token
    const resetToken = generateTokenWithExpiry(1); // 1 hour
    const hashedToken = hashToken(resetToken.token);

    // Store reset token
    resetTokens.set(hashedToken, {
      userId: user.id,
      email: user.email,
      expiresAt: resetToken.expiresAt,
    });

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
  } catch (error) {
    console.error("Forgot password error:", error);
    req.flash("error", "An error occurred. Please try again.");
    res.redirect("/forgot-password");
  }
};

// Reset password controller
const resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    const { password } = req.body;

    if (!token) {
      req.flash("error", "Reset token is required");
      return res.redirect("/forgot-password");
    }

    const hashedToken = hashToken(token);
    const tokenData = resetTokens.get(hashedToken);

    if (!tokenData) {
      req.flash("error", "Invalid or expired reset token");
      return res.redirect("/forgot-password");
    }

    if (isTokenExpired(tokenData.expiresAt)) {
      resetTokens.delete(hashedToken);
      req.flash(
        "error",
        "Reset token has expired. Please request a new password reset."
      );
      return res.redirect("/forgot-password");
    }

    // Find user
    const users = require("./authController").getUsers();
    const user = users.find((u) => u.id === tokenData.userId);

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/forgot-password");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;

    // Remove used token
    resetTokens.delete(hashedToken);

    req.flash(
      "success",
      "Password has been reset successfully. You can now log in with your new password."
    );
    res.redirect("/login");
  } catch (error) {
    console.error("Reset password error:", error);
    req.flash("error", "Password reset failed. Please try again.");
    res.redirect("/forgot-password");
  }
};

module.exports = {
  forgotPassword,
  resetPassword,
  getResetTokens,
};
