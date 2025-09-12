const {
  AppError,
  AuthError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  UnprocessableEntityError,
  TooManyRequestsError,
  InternalServerError,
  DatabaseError,
  EmailError,
  TokenError,
  PasswordError,
  isOperationalError,
  createError,
} = require("../../utils/errors");

describe("Error Classes", () => {
  describe("AppError", () => {
    test("should create error with default values", () => {
      const error = new AppError("Test message");

      expect(error.message).toBe("Test message");
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.status).toBe("error");
      expect(error.name).toBe("Error");
    });

    test("should create error with custom values", () => {
      const error = new AppError("Test message", 400, false);

      expect(error.message).toBe("Test message");
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(false);
      expect(error.status).toBe("fail");
    });

    test("should set status based on statusCode", () => {
      const error4xx = new AppError("Client error", 400);
      const error5xx = new AppError("Server error", 500);

      expect(error4xx.status).toBe("fail");
      expect(error5xx.status).toBe("error");
    });

    test("should capture stack trace", () => {
      const error = new AppError("Test message");
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe("string");
    });
  });

  describe("AuthError", () => {
    test("should create auth error with default values", () => {
      const error = new AuthError();

      expect(error.message).toBe("Authentication failed");
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe("AuthError");
      expect(error.status).toBe("fail");
    });

    test("should create auth error with custom message", () => {
      const error = new AuthError("Custom auth message");

      expect(error.message).toBe("Custom auth message");
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe("AuthError");
    });

    test("should create auth error with custom status code", () => {
      const error = new AuthError("Forbidden", 403);

      expect(error.message).toBe("Forbidden");
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe("AuthError");
    });
  });

  describe("ValidationError", () => {
    test("should create validation error with default values", () => {
      const error = new ValidationError();

      expect(error.message).toBe("Validation failed");
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe("ValidationError");
      expect(error.status).toBe("fail");
    });

    test("should create validation error with custom message", () => {
      const error = new ValidationError("Invalid input data");

      expect(error.message).toBe("Invalid input data");
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe("ValidationError");
    });
  });

  describe("NotFoundError", () => {
    test("should create not found error with default values", () => {
      const error = new NotFoundError();

      expect(error.message).toBe("Resource not found");
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe("NotFoundError");
      expect(error.status).toBe("fail");
    });

    test("should create not found error with custom message", () => {
      const error = new NotFoundError("User not found");

      expect(error.message).toBe("User not found");
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe("NotFoundError");
    });
  });

  describe("ConflictError", () => {
    test("should create conflict error with default values", () => {
      const error = new ConflictError();

      expect(error.message).toBe("Resource already exists");
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe("ConflictError");
      expect(error.status).toBe("fail");
    });
  });

  describe("ForbiddenError", () => {
    test("should create forbidden error with default values", () => {
      const error = new ForbiddenError();

      expect(error.message).toBe("Access forbidden");
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe("ForbiddenError");
      expect(error.status).toBe("fail");
    });
  });

  describe("UnprocessableEntityError", () => {
    test("should create unprocessable entity error with default values", () => {
      const error = new UnprocessableEntityError();

      expect(error.message).toBe("Unprocessable entity");
      expect(error.statusCode).toBe(422);
      expect(error.name).toBe("UnprocessableEntityError");
      expect(error.status).toBe("fail");
    });
  });

  describe("TooManyRequestsError", () => {
    test("should create too many requests error with default values", () => {
      const error = new TooManyRequestsError();

      expect(error.message).toBe("Too many requests");
      expect(error.statusCode).toBe(429);
      expect(error.name).toBe("TooManyRequestsError");
      expect(error.status).toBe("fail");
    });
  });

  describe("InternalServerError", () => {
    test("should create internal server error with default values", () => {
      const error = new InternalServerError();

      expect(error.message).toBe("Internal server error");
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe("InternalServerError");
      expect(error.status).toBe("error");
    });
  });

  describe("DatabaseError", () => {
    test("should create database error with default values", () => {
      const error = new DatabaseError();

      expect(error.message).toBe("Database operation failed");
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe("DatabaseError");
      expect(error.status).toBe("error");
    });
  });

  describe("EmailError", () => {
    test("should create email error with default values", () => {
      const error = new EmailError();

      expect(error.message).toBe("Email service failed");
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe("EmailError");
      expect(error.status).toBe("error");
    });
  });

  describe("TokenError", () => {
    test("should create token error with default values", () => {
      const error = new TokenError();

      expect(error.message).toBe("Token error");
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe("TokenError");
      expect(error.status).toBe("fail");
    });
  });

  describe("PasswordError", () => {
    test("should create password error with default values", () => {
      const error = new PasswordError();

      expect(error.message).toBe("Password error");
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe("PasswordError");
      expect(error.status).toBe("fail");
    });
  });

  describe("isOperationalError()", () => {
    test("should return true for AppError instances", () => {
      const error = new AppError("Test message");
      expect(isOperationalError(error)).toBe(true);
    });

    test("should return true for custom error instances", () => {
      const authError = new AuthError("Auth failed");
      const validationError = new ValidationError("Validation failed");

      expect(isOperationalError(authError)).toBe(true);
      expect(isOperationalError(validationError)).toBe(true);
    });

    test("should return false for non-AppError instances", () => {
      const regularError = new Error("Regular error");
      const typeError = new TypeError("Type error");

      expect(isOperationalError(regularError)).toBe(false);
      expect(isOperationalError(typeError)).toBe(false);
    });

    test("should return false for non-error objects", () => {
      expect(isOperationalError(null)).toBe(false);
      expect(isOperationalError(undefined)).toBe(false);
      expect(isOperationalError("string")).toBe(false);
      expect(isOperationalError(123)).toBe(false);
      expect(isOperationalError({})).toBe(false);
    });
  });

  describe("createError()", () => {
    test("should create error with default values", () => {
      const error = createError("Test message");

      expect(error.message).toBe("Test message");
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe("AppError");
      expect(error.isOperational).toBe(true);
    });

    test("should create error with custom values", () => {
      const error = createError("Test message", 400, "CustomError");

      expect(error.message).toBe("Test message");
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe("CustomError");
      expect(error.isOperational).toBe(true);
    });

    test("should create AppError instance", () => {
      const error = createError("Test message");
      expect(error instanceof AppError).toBe(true);
    });
  });

  describe("Error inheritance", () => {
    test("all custom errors should extend AppError", () => {
      const authError = new AuthError();
      const validationError = new ValidationError();
      const notFoundError = new NotFoundError();

      expect(authError instanceof AppError).toBe(true);
      expect(validationError instanceof AppError).toBe(true);
      expect(notFoundError instanceof AppError).toBe(true);
    });

    test("all custom errors should extend Error", () => {
      const authError = new AuthError();
      const validationError = new ValidationError();
      const notFoundError = new NotFoundError();

      expect(authError instanceof Error).toBe(true);
      expect(validationError instanceof Error).toBe(true);
      expect(notFoundError instanceof Error).toBe(true);
    });
  });
});
