const logger = require("../utils/logger");

const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || err.status || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || "Internal Server Error";

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 400;
    message = "Invalid resource ID format.";
  }

  // Handle Express body size limit error (413)
  if (err.type === "entity.too.large" || err.statusCode === 413) {
    statusCode = 413;
    message = "Request body payload too large. Maximum allowed size is 1MB.";
  }

  // Handle Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `An account with this ${field} already exists.`;
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(", ");
  }

  // Production error response sanitization (no stack traces, file paths, or DB credentials)
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction && statusCode === 500) {
    message = "An unexpected server error occurred.";
  }

  if (process.env.NODE_ENV !== "test") {
    logger.error("request_error", {
      status: statusCode,
      message,
      route: req?.originalUrl || null,
      method: req?.method || null
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: isProduction ? undefined : err.stack
  });
};

module.exports = errorHandler;
