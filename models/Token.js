const {
  generateTokenWithExpiry,
  isTokenExpired,
  hashToken,
} = require("../utils/tokenUtils");

// In-memory storage for tokens (in production, replace with database)
let verificationTokens = new Map();
let resetTokens = new Map();

class Token {
  constructor({ token, userId, email, type, expiresAt }) {
    this.token = token;
    this.userId = userId;
    this.email = email;
    this.type = type; // 'verification' or 'reset'
    this.expiresAt = expiresAt;
    this.createdAt = new Date();
  }

  // Create verification token
  static createVerificationToken(userId, email, expiryHours = 24) {
    const tokenData = generateTokenWithExpiry(expiryHours);
    const hashedToken = hashToken(tokenData.token);

    const token = new Token({
      token: tokenData.token,
      userId,
      email,
      type: "verification",
      expiresAt: tokenData.expiresAt,
    });

    verificationTokens.set(hashedToken, token);
    return token;
  }

  // Create reset token
  static createResetToken(userId, email, expiryHours = 1) {
    const tokenData = generateTokenWithExpiry(expiryHours);
    const hashedToken = hashToken(tokenData.token);

    const token = new Token({
      token: tokenData.token,
      userId,
      email,
      type: "reset",
      expiresAt: tokenData.expiresAt,
    });

    resetTokens.set(hashedToken, token);
    return token;
  }

  // Find verification token
  static findVerificationToken(tokenString) {
    const hashedToken = hashToken(tokenString);
    const token = verificationTokens.get(hashedToken);

    if (!token) {
      return null;
    }

    if (isTokenExpired(token.expiresAt)) {
      verificationTokens.delete(hashedToken);
      return null;
    }

    return token;
  }

  // Find reset token
  static findResetToken(tokenString) {
    const hashedToken = hashToken(tokenString);
    const token = resetTokens.get(hashedToken);

    if (!token) {
      return null;
    }

    if (isTokenExpired(token.expiresAt)) {
      resetTokens.delete(hashedToken);
      return null;
    }

    return token;
  }

  // Delete verification token
  static deleteVerificationToken(tokenString) {
    const hashedToken = hashToken(tokenString);
    return verificationTokens.delete(hashedToken);
  }

  // Delete reset token
  static deleteResetToken(tokenString) {
    const hashedToken = hashToken(tokenString);
    return resetTokens.delete(hashedToken);
  }

  // Clean expired tokens (cleanup function)
  static cleanExpiredTokens() {
    // Clean verification tokens
    for (const [hashedToken, token] of verificationTokens.entries()) {
      if (isTokenExpired(token.expiresAt)) {
        verificationTokens.delete(hashedToken);
      }
    }

    // Clean reset tokens
    for (const [hashedToken, token] of resetTokens.entries()) {
      if (isTokenExpired(token.expiresAt)) {
        resetTokens.delete(hashedToken);
      }
    }
  }

  // Get all verification tokens (for debugging)
  static getAllVerificationTokens() {
    return Array.from(verificationTokens.values());
  }

  // Get all reset tokens (for debugging)
  static getAllResetTokens() {
    return Array.from(resetTokens.values());
  }

  // Get tokens count (for debugging)
  static getTokensCount() {
    return {
      verification: verificationTokens.size,
      reset: resetTokens.size,
    };
  }
}

module.exports = Token;
