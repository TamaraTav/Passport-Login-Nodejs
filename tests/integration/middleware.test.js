const request = require("supertest");
const express = require("express");
const session = require("express-session");
const flash = require("express-flash");

// Import middleware
const {
  securityHeaders,
  generalLimiter,
  loginLimiter,
  registerLimiter,
} = require("../../middleware/security");
const {
  registerValidation,
  loginValidation,
  handleValidationErrors,
} = require("../../middleware/validation");
const { errorHandler } = require("../../middleware/errorHandler");

describe("Middleware Integration Tests", () => {
  let app;

  beforeEach(() => {
    app = express();

    // Set view engine
    app.set("view engine", "ejs");
    app.set("views", "./views");

    app.use(express.urlencoded({ extended: false }));
    app.use(
      session({
        secret: "test-secret",
        resave: false,
        saveUninitialized: false,
      })
    );
    app.use(flash());
  });

  describe("Security Headers", () => {
    test("should set security headers", async () => {
      app.use(securityHeaders);
      app.get("/test", (req, res) => res.send("OK"));

      const response = await request(app).get("/test").expect(200);

      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBe("DENY");
      // XSS protection is deprecated in modern browsers, helmet sets it to 0
      expect(response.headers["x-xss-protection"]).toBe("0");
    });
  });

  describe("Rate Limiting", () => {
    test("generalLimiter should work", async () => {
      app.use(generalLimiter);
      app.get("/test", (req, res) => res.send("OK"));

      // Make multiple requests (within limit)
      for (let i = 0; i < 3; i++) {
        await request(app).get("/test").expect(200);
      }
    });

    test("loginLimiter should work", async () => {
      app.use("/login", loginLimiter);
      app.post("/login", (req, res) => res.send("OK"));

      // Make multiple login attempts
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post("/login")
          .send({ email: "test@example.com", password: "password" });
      }

      // Should hit rate limit
      await request(app)
        .post("/login")
        .send({ email: "test@example.com", password: "password" })
        .expect(429);
    });

    test("registerLimiter should work", async () => {
      app.use("/register", registerLimiter);
      app.post("/register", (req, res) => res.send("OK"));

      // Make multiple registration attempts
      for (let i = 0; i < 4; i++) {
        await request(app)
          .post("/register")
          .send({
            name: "Test User",
            email: `test${i}@example.com`,
            password: "Password123!",
            confirmPassword: "Password123!",
          });
      }

      // Should hit rate limit
      await request(app)
        .post("/register")
        .send({
          name: "Test User",
          email: "test5@example.com",
          password: "Password123!",
          confirmPassword: "Password123!",
        })
        .expect(429);
    });
  });

  describe("Validation Middleware", () => {
    test("registerValidation should validate required fields", async () => {
      app.post(
        "/register",
        registerValidation,
        handleValidationErrors,
        (req, res) => res.send("OK")
      );

      const response = await request(app)
        .post("/register")
        .send({})
        .expect(302);

      expect(response.headers.location).toBe("/register");
    });

    test("registerValidation should validate email format", async () => {
      app.post(
        "/register",
        registerValidation,
        handleValidationErrors,
        (req, res) => res.send("OK")
      );

      const response = await request(app)
        .post("/register")
        .send({
          name: "Test User",
          email: "invalid-email",
          password: "Password123!",
          confirmPassword: "Password123!",
        })
        .expect(302);

      expect(response.headers.location).toBe("/register");
    });

    test("registerValidation should validate password strength", async () => {
      app.post(
        "/register",
        registerValidation,
        handleValidationErrors,
        (req, res) => res.send("OK")
      );

      const response = await request(app)
        .post("/register")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "weak",
          confirmPassword: "weak",
        })
        .expect(302);

      expect(response.headers.location).toBe("/register");
    });

    test("registerValidation should validate password confirmation", async () => {
      app.post(
        "/register",
        registerValidation,
        handleValidationErrors,
        (req, res) => res.send("OK")
      );

      const response = await request(app)
        .post("/register")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "Password123!",
          confirmPassword: "DifferentPassword123!",
        })
        .expect(302);

      expect(response.headers.location).toBe("/register");
    });

    test("loginValidation should validate required fields", async () => {
      app.post("/login", loginValidation, handleValidationErrors, (req, res) =>
        res.send("OK")
      );

      const response = await request(app).post("/login").send({}).expect(302);

      expect(response.headers.location).toBe("/login");
    });

    test("loginValidation should validate email format", async () => {
      app.post("/login", loginValidation, handleValidationErrors, (req, res) =>
        res.send("OK")
      );

      const response = await request(app)
        .post("/login")
        .send({
          email: "invalid-email",
          password: "password",
        })
        .expect(302);

      expect(response.headers.location).toBe("/login");
    });
  });

  describe("Error Handler", () => {
    test("should handle validation errors", async () => {
      app.get("/test-error", (req, res, next) => {
        const error = new Error("Test error");
        error.statusCode = 400;
        next(error);
      });
      app.use(errorHandler);

      await request(app).get("/test-error").expect(400);
    });

    test("should handle 404 errors", async () => {
      app.get("*", (req, res, next) => {
        const error = new Error("Not found");
        error.statusCode = 404;
        next(error);
      });
      app.use(errorHandler);

      await request(app).get("/nonexistent").expect(404);
    });
  });
});
