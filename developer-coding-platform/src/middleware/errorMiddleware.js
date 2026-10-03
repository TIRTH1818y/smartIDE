const { errorResponse } = require('../utils/response');

/**
 * 404 Not Found Middleware
 */
const notFound = (req, res, next) => {
  return errorResponse(res, 404, `Route Not Found - ${req.originalUrl}`);
};

/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';
  let errorDetails = null;

  // Mongoose Cast Error (Invalid ObjectId format)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found. Invalid ID format: ${err.value}`;
  }

  // Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for '${field}'. Please use another value.`;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // JsonWebTokenError
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }

  // TokenExpiredError
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }

  // Include stack trace only in non-production environments if needed internally
  if (process.env.NODE_ENV !== 'production') {
    errorDetails = err.stack;
  }

  console.error(`[API Error] ${statusCode} - ${message}`);

  return errorResponse(res, statusCode, message, errorDetails);
};

module.exports = {
  notFound,
  errorHandler,
};
