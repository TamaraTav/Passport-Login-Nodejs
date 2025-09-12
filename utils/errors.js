// Custom Error Classes for better error handling

class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication related errors
class AuthError extends AppError {
  constructor(message = "Authentication failed", statusCode = 401) {
    super(message, statusCode);
    this.name = "AuthError";
  }
}

class ValidationError extends AppError {
  constructor(message = "Validation failed", statusCode = 400) {
    super(message, statusCode);
    this.name = "ValidationError";
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found", statusCode = 404) {
    super(message, statusCode);
    this.name = "NotFoundError";
  }
}

class ConflictError extends AppError {
  constructor(message = "Resource already exists", statusCode = 409) {
    super(message, statusCode);
    this.name = "ConflictError";
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Access forbidden", statusCode = 403) {
    super(message, statusCode);
    this.name = "ForbiddenError";
  }
}

class UnprocessableEntityError extends AppError {
  constructor(message = "Unprocessable entity", statusCode = 422) {
    super(message, statusCode);
    this.name = "UnprocessableEntityError";
  }
}

class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests", statusCode = 429) {
    super(message, statusCode);
    this.name = "TooManyRequestsError";
  }
}

class InternalServerError extends AppError {
  constructor(message = "Internal server error", statusCode = 500) {
    super(message, statusCode);
    this.name = "InternalServerError";
  }
}

// Database related errors
class DatabaseError extends AppError {
  constructor(message = "Database operation failed", statusCode = 500) {
    super(message, statusCode);
    this.name = "DatabaseError";
  }
}

// Email service errors
class EmailError extends AppError {
  constructor(message = "Email service failed", statusCode = 500) {
    super(message, statusCode);
    this.name = "EmailError";
  }
}

// Token related errors
class TokenError extends AppError {
  constructor(message = "Token error", statusCode = 401) {
    super(message, statusCode);
    this.name = "TokenError";
  }
}

// Password related errors
class PasswordError extends AppError {
  constructor(message = "Password error", statusCode = 400) {
    super(message, statusCode);
    this.name = "PasswordError";
  }
}

// Helper function to check if error is operational
const isOperationalError = (error) => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

// Helper function to create error from different sources
const createError = (message, statusCode = 500, name = "AppError") => {
  const error = new AppError(message, statusCode);
  error.name = name;
  return error;
};

module.exports = {
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
};
