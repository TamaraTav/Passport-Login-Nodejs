const request = require("supertest");
const express = require("express");
const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");

// Import our app components
const { router: authRoutes } = require("../../routes/authRoutes");
const { errorHandler } = require("../../middleware/errorHandler");

// Create test app
const createTestApp = () => {
  const app = express();

  // Set view engine
  app.set("view engine", "ejs");
  app.set("views", "./views");

  // Middleware
  app.use(express.urlencoded({ extended: false }));
  app.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: false,
    })
  );
  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());

  // Mock passport configuration for tests
  require("../../passport-config");

  // Routes
  app.use("/", authRoutes);

  // Error handling
  app.use(errorHandler);

  return app;
};

describe("Auth Routes Integration Tests", () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    // Clear any rate limiting state
    jest.clearAllMocks();
  });

  describe("GET /register", () => {
    test("should render register page", async () => {
      const response = await request(app).get("/register").expect(200);

      expect(response.text).toContain("register");
    });
  });

  describe("GET /login", () => {
    test("should render login page", async () => {
      const response = await request(app).get("/login").expect(200);

      expect(response.text).toContain("login");
    });
  });

  describe("POST /register", () => {
    test("should register new user successfully", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      };

      const response = await request(app)
        .post("/register")
        .send(userData)
        .expect(302); // Redirect after registration

      expect(response.headers.location).toBe("/login");
    });

    test("should fail with invalid email", async () => {
      const userData = {
        name: "Test User",
        email: "invalid-email",
        password: "Password123!",
        confirmPassword: "Password123!",
      };

      const response = await request(app)
        .post("/register")
        .send(userData)
        .expect(302);

      expect(response.headers.location).toBe("/register");
    });

    test("should fail with weak password", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "123",
        confirmPassword: "123",
      };

      const response = await request(app)
        .post("/register")
        .send(userData)
        .expect(302);

      expect(response.headers.location).toBe("/register");
    });

    test("should fail with mismatched passwords", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "Password123!",
        confirmPassword: "DifferentPassword123!",
      };

      const response = await request(app)
        .post("/register")
        .send(userData)
        .expect(302);

      expect(response.headers.location).toBe("/register");
    });

    test("should fail with missing required fields", async () => {
      const userData = {
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      };

      const response = await request(app)
        .post("/register")
        .send(userData)
        .expect(302);

      expect(response.headers.location).toBe("/register");
    });
  });

  describe("POST /login", () => {
    test("should fail with invalid credentials", async () => {
      const loginData = {
        email: "nonexistent@example.com",
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/login")
        .send(loginData)
        .expect(302);

      expect(response.headers.location).toBe("/login");
    });

    test("should fail with missing credentials", async () => {
      const response = await request(app).post("/login").send({}).expect(302);

      expect(response.headers.location).toBe("/login");
    });
  });

  describe("GET /verify-email", () => {
    test("should fail without token", async () => {
      const response = await request(app).get("/verify-email").expect(302);

      expect(response.headers.location).toBe("/login");
    });

    test("should fail with invalid token", async () => {
      const response = await request(app)
        .get("/verify-email?token=invalid-token")
        .expect(302);

      expect(response.headers.location).toBe("/login");
    });
  });

  describe("DELETE /logout", () => {
    test("should logout successfully", async () => {
      const response = await request(app).delete("/logout").expect(302);

      expect(response.headers.location).toBe("/login");
    });
  });

  describe("Error handling", () => {
    test("should handle 404 for undefined routes", async () => {
      const response = await request(app).get("/undefined-route").expect(404);
    });
  });
});
