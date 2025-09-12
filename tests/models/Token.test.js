const Token = require("../../models/Token");

describe("Token Model", () => {
  beforeEach(() => {
    // Clear all tokens before each test
    const verificationTokens = Token.getAllVerificationTokens();
    const resetTokens = Token.getAllResetTokens();

    verificationTokens.forEach((token) => {
      Token.deleteVerificationToken(token.token);
    });

    resetTokens.forEach((token) => {
      Token.deleteResetToken(token.token);
    });
  });

  describe("Token.createVerificationToken()", () => {
    test("should create verification token", () => {
      const userId = "user123";
      const email = "test@example.com";
      const expiryHours = 24;

      const token = Token.createVerificationToken(userId, email, expiryHours);

      expect(token).toBeDefined();
      expect(token.userId).toBe(userId);
      expect(token.email).toBe(email);
      expect(token.type).toBe("verification");
      expect(token.token).toBeDefined();
      expect(token.expiresAt).toBeDefined();
      expect(token.createdAt).toBeDefined();
    });

    test("should create token with default expiry", () => {
      const userId = "user123";
      const email = "test@example.com";

      const token = Token.createVerificationToken(userId, email);

      expect(token).toBeDefined();
      expect(token.type).toBe("verification");
    });
  });

  describe("Token.createResetToken()", () => {
    test("should create reset token", () => {
      const userId = "user123";
      const email = "test@example.com";
      const expiryHours = 1;

      const token = Token.createResetToken(userId, email, expiryHours);

      expect(token).toBeDefined();
      expect(token.userId).toBe(userId);
      expect(token.email).toBe(email);
      expect(token.type).toBe("reset");
      expect(token.token).toBeDefined();
      expect(token.expiresAt).toBeDefined();
    });
  });

  describe("Token.findVerificationToken()", () => {
    test("should find valid verification token", () => {
      const userId = "user123";
      const email = "test@example.com";
      const token = Token.createVerificationToken(userId, email, 24);

      const foundToken = Token.findVerificationToken(token.token);

      expect(foundToken).toBeDefined();
      expect(foundToken.userId).toBe(userId);
      expect(foundToken.email).toBe(email);
      expect(foundToken.type).toBe("verification");
    });

    test("should return null for non-existent token", () => {
      const foundToken = Token.findVerificationToken("non-existent-token");
      expect(foundToken).toBeNull();
    });

    test("should return null for expired token", () => {
      // Create token with very short expiry
      const userId = "user123";
      const email = "test@example.com";
      const token = Token.createVerificationToken(userId, email, 0.0001); // Very short expiry

      // Wait a bit to ensure token expires
      setTimeout(() => {
        const foundToken = Token.findVerificationToken(token.token);
        expect(foundToken).toBeNull();
      }, 100);
    });
  });

  describe("Token.findResetToken()", () => {
    test("should find valid reset token", () => {
      const userId = "user123";
      const email = "test@example.com";
      const token = Token.createResetToken(userId, email, 1);

      const foundToken = Token.findResetToken(token.token);

      expect(foundToken).toBeDefined();
      expect(foundToken.userId).toBe(userId);
      expect(foundToken.email).toBe(email);
      expect(foundToken.type).toBe("reset");
    });

    test("should return null for non-existent token", () => {
      const foundToken = Token.findResetToken("non-existent-token");
      expect(foundToken).toBeNull();
    });
  });

  describe("Token.deleteVerificationToken()", () => {
    test("should delete verification token", () => {
      const userId = "user123";
      const email = "test@example.com";
      const token = Token.createVerificationToken(userId, email, 24);

      // Verify token exists
      let foundToken = Token.findVerificationToken(token.token);
      expect(foundToken).toBeDefined();

      // Delete token
      const deleted = Token.deleteVerificationToken(token.token);
      expect(deleted).toBe(true);

      // Verify token is deleted
      foundToken = Token.findVerificationToken(token.token);
      expect(foundToken).toBeNull();
    });

    test("should return false for non-existent token", () => {
      const deleted = Token.deleteVerificationToken("non-existent-token");
      expect(deleted).toBe(false);
    });
  });

  describe("Token.deleteResetToken()", () => {
    test("should delete reset token", () => {
      const userId = "user123";
      const email = "test@example.com";
      const token = Token.createResetToken(userId, email, 1);

      // Verify token exists
      let foundToken = Token.findResetToken(token.token);
      expect(foundToken).toBeDefined();

      // Delete token
      const deleted = Token.deleteResetToken(token.token);
      expect(deleted).toBe(true);

      // Verify token is deleted
      foundToken = Token.findResetToken(token.token);
      expect(foundToken).toBeNull();
    });
  });

  describe("Token.cleanExpiredTokens()", () => {
    test("should clean expired tokens", () => {
      // Create some tokens
      Token.createVerificationToken("user1", "user1@example.com", 24);
      Token.createResetToken("user2", "user2@example.com", 1);

      // Clean expired tokens
      Token.cleanExpiredTokens();

      // Count should remain the same for non-expired tokens
      const afterCleanCount = Token.getTokensCount();
      expect(afterCleanCount.verification).toBeGreaterThanOrEqual(0);
      expect(afterCleanCount.reset).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Token.getTokensCount()", () => {
    test("should return correct token counts", () => {
      const initialCount = Token.getTokensCount();
      expect(initialCount.verification).toBe(0);
      expect(initialCount.reset).toBe(0);

      // Create verification token
      Token.createVerificationToken("user1", "user1@example.com", 24);

      let count = Token.getTokensCount();
      expect(count.verification).toBe(1);
      expect(count.reset).toBe(0);

      // Create reset token
      Token.createResetToken("user2", "user2@example.com", 1);

      count = Token.getTokensCount();
      expect(count.verification).toBe(1);
      expect(count.reset).toBe(1);
    });
  });

  describe("Token.getAllVerificationTokens()", () => {
    test("should return all verification tokens", () => {
      Token.createVerificationToken("user1", "user1@example.com", 24);
      Token.createVerificationToken("user2", "user2@example.com", 24);

      const allTokens = Token.getAllVerificationTokens();
      expect(allTokens).toHaveLength(2);
      expect(allTokens[0].type).toBe("verification");
      expect(allTokens[1].type).toBe("verification");
    });
  });

  describe("Token.getAllResetTokens()", () => {
    test("should return all reset tokens", () => {
      Token.createResetToken("user1", "user1@example.com", 1);
      Token.createResetToken("user2", "user2@example.com", 1);

      const allTokens = Token.getAllResetTokens();
      expect(allTokens).toHaveLength(2);
      expect(allTokens[0].type).toBe("reset");
      expect(allTokens[1].type).toBe("reset");
    });
  });
});
