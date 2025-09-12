const User = require("../../models/User");
const bcrypt = require("bcrypt");

describe("User Model", () => {
  beforeEach(() => {
    // Clear users array before each test
    User.getAll().length = 0;
  });

  describe("User.create()", () => {
    test("should create a new user with hashed password", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Should be hashed
      expect(user.isVerified).toBe(false);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeDefined();
    });

    test("should throw error if user already exists", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      // Create first user
      await User.create(userData);

      // Try to create user with same email
      await expect(User.create(userData)).rejects.toThrow(
        "User with this email already exists"
      );
    });

    test("should hash password correctly", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const user = await User.create(userData);
      const isPasswordValid = await bcrypt.compare(
        "password123",
        user.password
      );

      expect(isPasswordValid).toBe(true);
    });
  });

  describe("User.findById()", () => {
    test("should find user by id", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const createdUser = await User.create(userData);
      const foundUser = User.findById(createdUser.id);

      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(createdUser.id);
      expect(foundUser.email).toBe(userData.email);
    });

    test("should return undefined for non-existent id", () => {
      const foundUser = User.findById("non-existent-id");
      expect(foundUser).toBeUndefined();
    });
  });

  describe("User.findByEmail()", () => {
    test("should find user by email", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      await User.create(userData);
      const foundUser = User.findByEmail(userData.email);

      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe(userData.email);
    });

    test("should return undefined for non-existent email", () => {
      const foundUser = User.findByEmail("nonexistent@example.com");
      expect(foundUser).toBeUndefined();
    });
  });

  describe("User.verifyUser()", () => {
    test("should verify user", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const createdUser = await User.create(userData);
      expect(createdUser.isVerified).toBe(false);

      const verifiedUser = User.verifyUser(createdUser.id);
      expect(verifiedUser.isVerified).toBe(true);
    });

    test("should return null for non-existent user", () => {
      const result = User.verifyUser("non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("User.updatePassword()", () => {
    test("should update user password", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const createdUser = await User.create(userData);
      const oldPassword = createdUser.password;

      const updatedUser = await User.updatePassword(
        createdUser.id,
        "newpassword123"
      );

      expect(updatedUser).toBeDefined();
      expect(updatedUser.password).not.toBe(oldPassword);

      // Verify new password works
      const isNewPasswordValid = await bcrypt.compare(
        "newpassword123",
        updatedUser.password
      );
      expect(isNewPasswordValid).toBe(true);
    });

    test("should return null for non-existent user", async () => {
      const result = await User.updatePassword(
        "non-existent-id",
        "newpassword123"
      );
      expect(result).toBeNull();
    });
  });

  describe("User.getCount()", () => {
    test("should return correct user count", async () => {
      expect(User.getCount()).toBe(0);

      await User.create({
        name: "User 1",
        email: "user1@example.com",
        password: "password123",
      });

      expect(User.getCount()).toBe(1);

      await User.create({
        name: "User 2",
        email: "user2@example.com",
        password: "password123",
      });

      expect(User.getCount()).toBe(2);
    });
  });

  describe("User instance methods", () => {
    test("verifyPassword should work correctly", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const user = await User.create(userData);

      const isValid = await user.verifyPassword("password123");
      expect(isValid).toBe(true);

      const isInvalid = await user.verifyPassword("wrongpassword");
      expect(isInvalid).toBe(false);
    });

    test("toJSON should exclude password", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const user = await User.create(userData);
      const userJSON = user.toJSON();

      expect(userJSON.password).toBeUndefined();
      expect(userJSON.name).toBe(userData.name);
      expect(userJSON.email).toBe(userData.email);
    });
  });
});
