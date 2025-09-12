const bcrypt = require("bcrypt");
const passport = require("passport");
const { sendVerificationEmail } = require("../services/emailService");
const {
  generateTokenWithExpiry,
  isTokenExpired,
  hashToken,
} = require("../utils/tokenUtils");

// In-memory storage (in production, use database)
let users = [];
let verificationTokens = new Map();

// Get users and verificationTokens for routes
const getUsers = () => users;
const getVerificationTokens = () => verificationTokens;

// Registration controller
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = users.find((user) => user.email === email);
    if (existingUser) {
      req.flash("error", "User with this email already exists");
      return res.redirect("/register");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = generateTokenWithExpiry(24); // 24 hours
    const hashedToken = hashToken(verificationToken);

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      createdAt: new Date(),
    };

    users.push(newUser);
    verificationTokens.set(hashedToken, {
      userId: newUser.id,
      email: newUser.email,
      expiresAt: verificationToken.expiresAt,
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken.token);
      req.flash(
        "success",
        "Registration successful! Please check your email to verify your account."
      );
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      req.flash(
        "success",
        `Registration successful! Verification link: http://localhost:3002/verify-email?token=${verificationToken.token}`
      );
    }

    console.log("Current users:", users.length);
    res.redirect("/login");
  } catch (error) {
    console.error("Registration error:", error);
    req.flash("error", "Registration failed. Please try again.");
    res.redirect("/register");
  }
};

// Login controller
const login = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Login error:", err);
      return next(err);
    }
    if (!user) {
      req.flash("error", info.message);
      return res.redirect("/login");
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      req.flash("success", `Welcome back, ${user.name}!`);
      return res.redirect("/");
    });
  })(req, res, next);
};

// Logout controller
const logout = (req, res) => {
  req.logOut((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    req.flash("success", "You have been logged out successfully");
    res.redirect("/login");
  });
};

// Email verification controller
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      req.flash("error", "Verification token is required");
      return res.redirect("/login");
    }

    const hashedToken = hashToken(token);
    const tokenData = verificationTokens.get(hashedToken);

    if (!tokenData) {
      req.flash("error", "Invalid or expired verification token");
      return res.redirect("/login");
    }

    if (isTokenExpired(tokenData.expiresAt)) {
      verificationTokens.delete(hashedToken);
      req.flash(
        "error",
        "Verification token has expired. Please register again."
      );
      return res.redirect("/register");
    }

    // Find and verify user
    const user = users.find((u) => u.id === tokenData.userId);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }

    user.isVerified = true;
    verificationTokens.delete(hashedToken);

    console.log("User verified:", user.isVerified);
    req.flash("success", "Email verified successfully! You can now log in.");
    res.redirect("/login");
  } catch (error) {
    console.error("Email verification error:", error);
    req.flash("error", "Email verification failed. Please try again.");
    res.redirect("/login");
  }
};

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  getUsers,
  getVerificationTokens,
};
