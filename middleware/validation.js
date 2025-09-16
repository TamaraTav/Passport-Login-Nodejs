const { body, validationResult } = require("express-validator");

// Password strength validation function
const validatePasswordStrength = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return errors;
};

// Registration validation rules
const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .custom((value) => {
      const strengthErrors = validatePasswordStrength(value);
      if (strengthErrors.length > 0) {
        throw new Error(strengthErrors.join(", "));
      }
      return true;
    }),

  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
];

// Login validation rules
const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    req.flash("error", errorMessages.join(", "));

    // Determine redirect URL based on the route
    const referer = req.get("Referrer") || "/";
    const isRegisterRoute = req.originalUrl.includes("/register");
    const isLoginRoute = req.originalUrl.includes("/login");
    const isForgotPasswordRoute = req.originalUrl.includes("/forgot-password");
    const isResetPasswordRoute = req.originalUrl.includes("/reset-password");

    let redirectUrl = "/";
    if (isRegisterRoute) {
      redirectUrl = "/register";
    } else if (isLoginRoute) {
      redirectUrl = "/login";
    } else if (isForgotPasswordRoute) {
      redirectUrl = "/forgot-password";
    } else if (isResetPasswordRoute) {
      redirectUrl = "/reset-password";
    } else if (referer !== "/") {
      redirectUrl = referer;
    }

    return res.redirect(redirectUrl);
  }
  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  handleValidationErrors,
  validatePasswordStrength,
  // Added below in export after definitions
};
