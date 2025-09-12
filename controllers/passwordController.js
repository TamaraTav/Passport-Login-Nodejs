const { sendPasswordResetEmail } = require("../services/emailService");
const User = require("../models/User");
const Token = require("../models/Token");

// Get resetTokens for routes
const getResetTokens = () => Token.getAllResetTokens();

// Forgot password controller
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

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
