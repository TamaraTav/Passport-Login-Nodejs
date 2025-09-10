require("dotenv").config();

const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const passport = require("passport");
const session = require("express-session");
const flash = require("express-flash");
const methodOverride = require("method-override");

// Import validation and security middleware
const {
  registerValidation,
  loginValidation,
  handleValidationErrors,
} = require("./middleware/validation");
const {
  loginLimiter,
  registerLimiter,
  generalLimiter,
  securityHeaders,
} = require("./middleware/security");

// Import email service and token utilities
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("./services/emailService");
const {
  generateTokenWithExpiry,
  isTokenExpired,
  hashToken,
} = require("./utils/tokenUtils");

const initializePassport = require("./passport-config");
initializePassport(
  passport,
  (id) => {
    return users.find((user) => user.id === id);
  },
  (email) => {
    return users.find((user) => user.email === email);
  }
);

// Security middleware
app.use(securityHeaders);
app.use(generalLimiter);

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "your-super-secret-session-key-change-this-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.set("view-engine", "ejs");
app.use(methodOverride("_method"));

const users = [];

// In-memory storage for tokens (in production, use database)
const verificationTokens = new Map();
const resetTokens = new Map();

// Debug: Log users on startup
console.log("Current users:", users.length);

app.get("/", checkAuthenticated, (req, res) => {
  res.render("index.ejs", { user: req.user });
});

app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login.ejs");
});

app.post(
  "/login",
  checkNotAuthenticated,
  loginLimiter,
  loginValidation,
  handleValidationErrors,
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register.ejs");
});

// Email verification route
app.get("/verify-email", (req, res) => {
  const { token } = req.query;

  if (!token) {
    req.flash("error", "Invalid verification link.");
    return res.redirect("/login");
  }

  const hashedToken = hashToken(token);
  const tokenData = verificationTokens.get(hashedToken);

  if (!tokenData || isTokenExpired(tokenData.expiresAt)) {
    req.flash("error", "Verification link has expired or is invalid.");
    return res.redirect("/login");
  }

  // Find and verify user
  const user = users.find((u) => u.id === tokenData.userId);
  if (!user) {
    req.flash("error", "User not found.");
    return res.redirect("/login");
  }

  // Mark user as verified
  user.isVerified = true;

  // Remove used token
  verificationTokens.delete(hashedToken);

  req.flash("success", "Email verified successfully! You can now log in.");
  res.redirect("/login");
});

// Password reset request route
app.get("/forgot-password", (req, res) => {
  res.render("forgot-password.ejs");
});

app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      req.flash("error", "Please enter your email address.");
      return res.redirect("/forgot-password");
    }

    // Find user by email
    const user = users.find((u) => u.email === email.toLowerCase());

    if (!user) {
      // Don't reveal if user exists or not for security
      req.flash(
        "success",
        "If an account with that email exists, a password reset link has been sent."
      );
      return res.redirect("/forgot-password");
    }

    // Generate reset token
    const { token, expiresAt } = generateTokenWithExpiry(1); // 1 hour
    const hashedToken = hashToken(token);

    // Store reset token
    resetTokens.set(hashedToken, {
      userId: user.id,
      email: user.email,
      expiresAt,
    });

    // Send reset email
    const emailResult = await sendPasswordResetEmail(
      user.email,
      token,
      user.name
    );

    if (emailResult.success) {
      req.flash("success", "Password reset link has been sent to your email.");
    } else {
      req.flash(
        "error",
        "Failed to send password reset email. Please try again."
      );
    }

    res.redirect("/forgot-password");
  } catch (error) {
    console.error("Password reset request error:", error);
    req.flash("error", "An error occurred. Please try again.");
    res.redirect("/forgot-password");
  }
});

// Password reset form route
app.get("/reset-password", (req, res) => {
  const { token } = req.query;

  if (!token) {
    req.flash("error", "Invalid reset link.");
    return res.redirect("/forgot-password");
  }

  const hashedToken = hashToken(token);
  const tokenData = resetTokens.get(hashedToken);

  if (!tokenData || isTokenExpired(tokenData.expiresAt)) {
    req.flash("error", "Reset link has expired or is invalid.");
    return res.redirect("/forgot-password");
  }

  res.render("reset-password.ejs", { token });
});

// Password reset submission route
app.post("/reset-password", async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      req.flash("error", "All fields are required.");
      return res.redirect(`/reset-password?token=${token}`);
    }

    if (password !== confirmPassword) {
      req.flash("error", "Passwords do not match.");
      return res.redirect(`/reset-password?token=${token}`);
    }

    const hashedToken = hashToken(token);
    const tokenData = resetTokens.get(hashedToken);

    if (!tokenData || isTokenExpired(tokenData.expiresAt)) {
      req.flash("error", "Reset link has expired or is invalid.");
      return res.redirect("/forgot-password");
    }

    // Find user
    const user = users.find((u) => u.id === tokenData.userId);
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/forgot-password");
    }

    // Validate password strength
    const { validatePasswordStrength } = require("./middleware/validation");
    const strengthErrors = validatePasswordStrength(password);
    if (strengthErrors.length > 0) {
      req.flash("error", strengthErrors.join(", "));
      return res.redirect(`/reset-password?token=${token}`);
    }

    // Update password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;

    // Remove used token
    resetTokens.delete(hashedToken);

    req.flash(
      "success",
      "Password has been reset successfully! You can now log in."
    );
    res.redirect("/login");
  } catch (error) {
    console.error("Password reset error:", error);
    req.flash("error", "An error occurred. Please try again.");
    res.redirect("/forgot-password");
  }
});

app.post(
  "/register",
  checkNotAuthenticated,
  registerLimiter,
  registerValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      // Check if user already exists
      const existingUser = users.find((user) => user.email === req.body.email);
      if (existingUser) {
        req.flash("error", "User with this email already exists");
        return res.redirect("/register");
      }

      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      // Generate verification token
      const { token, expiresAt } = generateTokenWithExpiry(24); // 24 hours
      const hashedToken = hashToken(token);

      const newUser = {
        id: Date.now().toString(),
        name: req.body.name.trim(),
        email: req.body.email.toLowerCase(),
        password: hashedPassword,
        isVerified: false,
        createdAt: new Date(),
      };

      users.push(newUser);

      // Store verification token
      verificationTokens.set(hashedToken, {
        userId: newUser.id,
        email: newUser.email,
        expiresAt,
      });

      // Send verification email
      const emailResult = await sendVerificationEmail(
        newUser.email,
        token,
        newUser.name
      );

      if (emailResult.success) {
        req.flash(
          "success",
          "Registration successful! Please check your email to verify your account."
        );
      } else {
        req.flash(
          "error",
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

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}

app.delete("/logout", (req, res) => {
  req.logOut((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect("/login");
  });
});

app.listen(3002);
