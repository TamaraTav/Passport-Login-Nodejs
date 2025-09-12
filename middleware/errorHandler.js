const {
  ValidationError,
  ConflictError,
  AuthError,
  NotFoundError,
} = require("../utils/errors");

// Development error response
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Production error response
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error("ERROR 💥", err);

    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }
};

// Handle specific error types
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new ValidationError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new ConflictError(message, 400);
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new ValidationError(message, 400);
};

const handleJWTError = () =>
  new AuthError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = () =>
  new AuthError("Your token has expired! Please log in again.", 401);

// Main error handling middleware
const errorHandler = (err, req, res) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === "ValidationError") error = handleValidationError(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

// Handle unhandled promise rejections
const handleUnhandledRejection = (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
};

// Handle uncaught exceptions
const handleUncaughtException = (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
};

// Async error wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// 404 handler for undefined routes
const notFound = (req, res, next) => {
  const err = new NotFoundError(
    `Can't find ${req.originalUrl} on this server!`
  );
  next(err);
};

module.exports = {
  errorHandler,
  handleUnhandledRejection,
  handleUncaughtException,
  catchAsync,
  notFound,
};
