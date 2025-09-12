const express = require("express");
const passport = require("passport");
const {
  registerValidation,
  loginValidation,
  handleValidationErrors,
} = require("../middleware/validation");
const { loginLimiter, registerLimiter } = require("../middleware/security");
const { generateTokenWithExpiry, hashToken } = require("../utils/tokenUtils");
const { sendVerificationEmail } = require("../services/emailService");

const router = express.Router();

// In-memory storage (temporary - will be replaced with database)
const users = [];
const verificationTokens = new Map();

// Register route
router.post(
  "/register",
  registerLimiter,
  registerValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = users.find((user) => user.email === email);
      if (existingUser) {
        req.flash("error", "User with this email already exists");
        return res.redirect("/register");
      }

      // Hash password
      const bcrypt = require("bcrypt");
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = {
        id: Date.now().toString(),
        name,
        email,
        password: hashedPassword,
        isVerified: false,
        createdAt: new Date(),
      };

      users.push(user);

      // Generate verification token
      const tokenData = generateTokenWithExpiry(24); // 24 hours
      const hashedToken = hashToken(tokenData.token);

      verificationTokens.set(hashedToken, {
        userId: user.id,
        email: user.email,
        expiresAt: tokenData.expiresAt,
      });

      // Send verification email
      try {
        await sendVerificationEmail(user.email, user.name, tokenData.token);
        req.flash(
          "success",
          "Registration successful! Please check your email to verify your account."
        );
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        req.flash(
          "warning",
          "Registration successful, but failed to send verification email. Please contact support."
        );
      }

      res.redirect("/login");
    } catch (error) {
      console.error("Registration error:", error);
      req.flash("error", "Registration failed. Please try again.");
      res.redirect("/register");
    }
  }
);

// Login route
router.post(
  "/login",
  loginLimiter,
  loginValidation,
  handleValidationErrors,
  (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Login error:", err);
        req.flash("error", "Login failed. Please try again.");
        return res.redirect("/login");
      }

      if (!user) {
        req.flash("error", info.message || "Invalid credentials");
        return res.redirect("/login");
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          req.flash("error", "Login failed. Please try again.");
          return res.redirect("/login");
        }

        req.flash("success", `Welcome back, ${user.name}!`);
        return res.redirect("/");
      });
    })(req, res, next);
  }
);

// Logout route
router.delete("/logout", (req, res) => {
  req.logOut((err) => {
    if (err) {
      console.error("Logout error:", err);
      req.flash("error", "Logout failed");
      return res.redirect("/");
    }
    req.flash("success", "You have been logged out successfully");
    res.redirect("/login");
  });
});

// Email verification route
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      req.flash("error", "Invalid verification link");
      return res.redirect("/login");
    }

    const hashedToken = hashToken(token);
    const tokenData = verificationTokens.get(hashedToken);

    if (!tokenData) {
      req.flash("error", "Invalid or expired verification link");
      return res.redirect("/login");
    }

    // Check if token is expired
    const { isTokenExpired } = require("../utils/tokenUtils");
    if (isTokenExpired(tokenData.expiresAt)) {
      verificationTokens.delete(hashedToken);
      req.flash(
        "error",
        "Verification link has expired. Please register again."
      );
      return res.redirect("/register");
    }

    // Find and verify user
    const userIndex = users.findIndex((user) => user.id === tokenData.userId);
    if (userIndex === -1) {
      req.flash("error", "User not found");
      return res.redirect("/register");
    }

    users[userIndex].isVerified = true;
    verificationTokens.delete(hashedToken);

    req.flash("success", "Email verified successfully! You can now log in.");
    res.redirect("/login");
  } catch (error) {
    console.error("Email verification error:", error);
    req.flash("error", "Email verification failed. Please try again.");
    res.redirect("/login");
  }
});

module.exports = { router, users, verificationTokens };
