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
      users.push({
        id: Date.now().toString(),
        name: req.body.name.trim(),
        email: req.body.email.toLowerCase(),
        password: hashedPassword,
      });
      req.flash("success", "Registration successful! Please log in.");
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
