const {
  generateVerificationToken,
  generateResetToken,
  generateTokenWithExpiry,
  isTokenExpired,
  hashToken,
} = require("../../utils/tokenUtils");

describe("Token Utils", () => {
  describe("generateVerificationToken()", () => {
    test("should generate a random hex token", () => {
      const token = generateVerificationToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBe(64); // 32 bytes = 64 hex characters
      expect(/^[a-f0-9]+$/.test(token)).toBe(true); // Should be hex
    });

    test("should generate different tokens each time", () => {
      const token1 = generateVerificationToken();
      const token2 = generateVerificationToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe("generateResetToken()", () => {
    test("should generate a random hex token", () => {
      const token = generateResetToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBe(64);
      expect(/^[a-f0-9]+$/.test(token)).toBe(true);
    });

    test("should generate different tokens each time", () => {
      const token1 = generateResetToken();
      const token2 = generateResetToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe("generateTokenWithExpiry()", () => {
    test("should generate token with expiry date", () => {
      const hours = 24;
      const result = generateTokenWithExpiry(hours);

      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.expiresAt).toBeDefined();
      expect(typeof result.token).toBe("string");
      expect(result.token.length).toBe(64);
      expect(result.expiresAt instanceof Date).toBe(true);
    });

    test("should set correct expiry time", () => {
      const hours = 2;
      const result = generateTokenWithExpiry(hours);
      const now = new Date();
      const expectedExpiry = new Date(now.getTime() + hours * 60 * 60 * 1000);

      // Allow 1 minute tolerance
      const timeDiff = Math.abs(
        result.expiresAt.getTime() - expectedExpiry.getTime()
      );
      expect(timeDiff).toBeLessThan(60000);
    });

    test("should use default 24 hours if no hours provided", () => {
      const result = generateTokenWithExpiry();
      const now = new Date();
      const expectedExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const timeDiff = Math.abs(
        result.expiresAt.getTime() - expectedExpiry.getTime()
      );
      expect(timeDiff).toBeLessThan(60000);
    });
  });

  describe("isTokenExpired()", () => {
    test("should return false for future date", () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      expect(isTokenExpired(futureDate)).toBe(false);
    });

    test("should return true for past date", () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      expect(isTokenExpired(pastDate)).toBe(true);
    });

    test("should return true for current time (edge case)", () => {
      const now = new Date();
      // Add 1ms to make it slightly in the past
      const pastTime = new Date(now.getTime() - 1);
      expect(isTokenExpired(pastTime)).toBe(true);
    });

    test("should handle very old dates", () => {
      const veryOldDate = new Date("2020-01-01");
      expect(isTokenExpired(veryOldDate)).toBe(true);
    });

    test("should handle very future dates", () => {
      const veryFutureDate = new Date("2030-01-01");
      expect(isTokenExpired(veryFutureDate)).toBe(false);
    });
  });

  describe("hashToken()", () => {
    test("should hash token consistently", () => {
      const token = "test-token-123";
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(token);
    });

    test("should produce different hashes for different tokens", () => {
      const token1 = "token1";
      const token2 = "token2";
      const hash1 = hashToken(token1);
      const hash2 = hashToken(token2);

      expect(hash1).not.toBe(hash2);
    });

    test("should produce hash of correct length", () => {
      const token = "test-token";
      const hash = hashToken(token);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      expect(hash.length).toBe(64); // SHA256 produces 64 character hex string
    });

    test("should handle empty string", () => {
      const hash = hashToken("");
      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
    });

    test("should handle special characters", () => {
      const token = "special!@#$%^&*()_+-=[]{}|;:,.<>?";
      const hash = hashToken(token);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      expect(hash.length).toBe(64);
    });
  });

  describe("Integration tests", () => {
    test("should work together for token generation and expiry check", () => {
      const hours = 1;
      const result = generateTokenWithExpiry(hours);

      // Token should not be expired immediately
      expect(isTokenExpired(result.expiresAt)).toBe(false);

      // Hash the token
      const hashedToken = hashToken(result.token);
      expect(hashedToken).toBeDefined();
      expect(hashedToken).not.toBe(result.token);
    });

    test("should handle token lifecycle", () => {
      // Generate token
      const result = generateTokenWithExpiry(0.001); // Very short expiry

      // Should not be expired initially
      expect(isTokenExpired(result.expiresAt)).toBe(false);

      // Wait for expiry (in real scenario, this would be handled by time)
      // For testing, we'll create a past date
      const pastDate = new Date(Date.now() - 1000);
      expect(isTokenExpired(pastDate)).toBe(true);
    });
  });
});
