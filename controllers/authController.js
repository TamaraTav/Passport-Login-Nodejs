const passport = require("passport");
const { sendVerificationEmail } = require("../services/emailService");
const User = require("../models/User");
const Token = require("../models/Token");
const {
  ConflictError,
  ValidationError,
  TokenError,
  EmailError,
} = require("../utils/errors");
const { catchAsync } = require("../middleware/errorHandler");

// Get users and verificationTokens for routes
const getUsers = () => User.getAll();
const getVerificationTokens = () => Token.getAllVerificationTokens();

// Registration controller
const register = catchAsync(async (req, res, next) => {
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
});

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
const verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.query;

  if (!token) {
    return next(new TokenError("Verification token is required"));
  }

  // Find verification token using Token model
  const tokenData = Token.findVerificationToken(token);

  if (!tokenData) {
    return next(new TokenError("Invalid or expired verification token"));
  }

  // Find and verify user using User model
  const user = User.verifyUser(tokenData.userId);
  if (!user) {
    return next(new ValidationError("User not found"));
  }

  // Delete used token
  Token.deleteVerificationToken(token);

  console.log("User verified:", user.isVerified);
  req.flash("success", "Email verified successfully! You can now log in.");
  res.redirect("/login");
});

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  getUsers,
  getVerificationTokens,
};
