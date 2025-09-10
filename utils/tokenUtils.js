const crypto = require("crypto");

// Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Generate password reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Generate token with expiration
const generateTokenWithExpiry = (expiryHours = 24) => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiryHours);

  return {
    token,
    expiresAt,
  };
};

// Check if token is expired
const isTokenExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

// Hash token for storage
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

module.exports = {
  generateVerificationToken,
  generateResetToken,
  generateTokenWithExpiry,
  isTokenExpired,
  hashToken,
};
