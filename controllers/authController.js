const passport = require("passport");
const { sendVerificationEmail } = require("../services/emailService");
const User = require("../models/User");
const Token = require("../models/Token");

// Get users and verificationTokens for routes
const getUsers = () => User.getAll();
const getVerificationTokens = () => Token.getAllVerificationTokens();

// Registration controller
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Create new user using User model
    const newUser = await User.create({ name, email, password });

    // Generate verification token using Token model
    const verificationToken = Token.createVerificationToken(
      newUser.id,
      newUser.email,
      24 // 24 hours
    );

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

    console.log("Current users:", User.getCount());
    res.redirect("/login");
  } catch (error) {
    console.error("Registration error:", error);
    if (error.message === "User with this email already exists") {
      req.flash("error", error.message);
    } else {
      req.flash("error", "Registration failed. Please try again.");
    }
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

    // Find verification token using Token model
    const tokenData = Token.findVerificationToken(token);

    if (!tokenData) {
      req.flash("error", "Invalid or expired verification token");
      return res.redirect("/login");
    }

    // Find and verify user using User model
    const user = User.verifyUser(tokenData.userId);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }

    // Delete used token
    Token.deleteVerificationToken(token);

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
