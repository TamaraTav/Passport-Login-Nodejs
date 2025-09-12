require("dotenv").config();

const express = require("express");
const app = express();
const passport = require("passport");
const session = require("express-session");
const flash = require("express-flash");
const methodOverride = require("method-override");

// Import security middleware
const { generalLimiter, securityHeaders } = require("./middleware/security");

// Import error handling middleware
const {
  errorHandler,
  notFound,
  handleUnhandledRejection,
  handleUncaughtException,
} = require("./middleware/errorHandler");

// Import routes
const {
  router: authRoutes,
  getUsers,
  getVerificationTokens,
} = require("./routes/authRoutes");
const {
  router: passwordRoutes,
  getResetTokens,
} = require("./routes/passwordRoutes");

const User = require("./models/User");
const initializePassport = require("./passport-config");
initializePassport(
  passport,
  (id) => {
    return User.findById(id);
  },
  (email) => {
    return User.findByEmail(email);
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

// Debug: Log users on startup
console.log("Current users:", users.length);

app.get("/", checkAuthenticated, (req, res) => {
  res.render("index.ejs", { user: req.user });
});

// Static routes
app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login.ejs", {
    error: req.flash("error"),
    success: req.flash("success"),
  });
});

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register.ejs", {
    error: req.flash("error"),
    success: req.flash("success"),
  });
});

// Use route modules
app.use("/", authRoutes);
app.use("/", passwordRoutes);

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

// Logout route is now handled in authRoutes

// Handle undefined routes (404)
app.all("*", notFound);

// Global error handling middleware (must be last)
app.use(errorHandler);

// Handle unhandled promise rejections
process.on("unhandledRejection", handleUnhandledRejection);

// Handle uncaught exceptions
process.on("uncaughtException", handleUncaughtException);

app.listen(3002);
