const request = require("supertest");
const express = require("express");
const session = require("express-session");
const flash = require("express-flash");

// Import our app components
const { router: passwordRoutes } = require("../../routes/passwordRoutes");
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

  // Routes
  app.use("/", passwordRoutes);

  // Error handling
  app.use(errorHandler);

  return app;
};

describe("Password Routes Integration Tests", () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  describe("GET /forgot-password", () => {
    test("should render forgot password page", async () => {
      const response = await request(app).get("/forgot-password").expect(200);

      expect(response.text).toContain("forgot-password");
    });
  });

  describe("POST /forgot-password", () => {
    test("should fail with missing email", async () => {
      const response = await request(app)
        .post("/forgot-password")
        .send({})
        .expect(302);

      expect(response.headers.location).toBe("/forgot-password");
    });

    test("should fail with invalid email format", async () => {
      const response = await request(app)
        .post("/forgot-password")
        .send({ email: "invalid-email" })
        .expect(302);

      expect(response.headers.location).toBe("/forgot-password");
    });

    test("should handle non-existent user email", async () => {
      const response = await request(app)
        .post("/forgot-password")
        .send({ email: "nonexistent@example.com" })
        .expect(302);

      expect(response.headers.location).toBe("/forgot-password");
    });
  });

  describe("GET /reset-password", () => {
    test("should fail without token", async () => {
      const response = await request(app).get("/reset-password").expect(302);

      expect(response.headers.location).toBe("/forgot-password");
    });

    test("should render reset password page with valid token", async () => {
      // This would need a valid token in a real test
      const response = await request(app)
        .get("/reset-password?token=some-token")
        .expect(200);

      expect(response.text).toContain("reset-password");
    });
  });

  describe("POST /reset-password", () => {
    test("should fail without token", async () => {
      const response = await request(app)
        .post("/reset-password")
        .send({
          password: "NewPassword123!",
          confirmPassword: "NewPassword123!",
        })
        .expect(302);

      expect(response.headers.location).toBe("/forgot-password");
    });

    test("should fail with missing password fields", async () => {
      const response = await request(app)
        .post("/reset-password")
        .send({ token: "some-token" })
        .expect(302);

      expect(response.headers.location).toContain("/reset-password");
    });

    test("should fail with mismatched passwords", async () => {
      const response = await request(app)
        .post("/reset-password")
        .send({
          token: "some-token",
          password: "NewPassword123!",
          confirmPassword: "DifferentPassword123!",
        })
        .expect(302);

      expect(response.headers.location).toContain("/reset-password");
    });

    test("should fail with weak password", async () => {
      const response = await request(app)
        .post("/reset-password")
        .send({
          token: "some-token",
          password: "123",
          confirmPassword: "123",
        })
        .expect(302);

      expect(response.headers.location).toContain("/reset-password");
    });

    test("should fail with invalid token", async () => {
      const response = await request(app)
        .post("/reset-password")
        .send({
          token: "invalid-token",
          password: "NewPassword123!",
          confirmPassword: "NewPassword123!",
        })
        .expect(302);

      expect(response.headers.location).toBe("/forgot-password");
    });
  });

  describe("Error handling", () => {
    test("should handle malformed requests", async () => {
      const response = await request(app)
        .post("/forgot-password")
        .send("invalid-data")
        .expect(400);
    });
  });
});
