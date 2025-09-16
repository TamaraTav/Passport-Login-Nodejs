const bcrypt = require("bcrypt");

// In-memory storage (in production, replace with database)
let users = [];

class User {
  constructor({
    id,
    name,
    email,
    password,
    isVerified = false,
    createdAt = new Date(),
  }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.isVerified = isVerified;
    this.createdAt = createdAt;
  }

  // Create new user
  static async create({ name, email, password }) {
    // Check if user already exists
    const existingUser = users.find((user) => user.email === email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      createdAt: new Date(),
    });

    users.push(newUser);
    return newUser;
  }

  // Find user by ID
  static findById(id) {
    return users.find((user) => user.id === id);
  }

  // Find user by email
  static findByEmail(email) {
    return users.find((user) => user.email === email);
  }

  // Verify user
  static verifyUser(id) {
    const user = users.find((u) => u.id === id);
    if (user) {
      user.isVerified = true;
      return user;
    }
    return null;
  }

  // Update user password
  static async updatePassword(id, newPassword) {
    const user = users.find((u) => u.id === id);
    if (user) {
      user.password = await bcrypt.hash(newPassword, 10);
      return user;
    }
    return null;
  }

  // Get all users (for debugging)
  static getAll() {
    return users;
  }

  // Get users count (for debugging)
  static getCount() {
    return users.length;
  }

  // Verify password
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // Convert to plain object (remove password)
  toJSON() {
    const userWithoutPassword = { ...this };
    delete userWithoutPassword.password;
    return userWithoutPassword;
  }
}

module.exports = User;
