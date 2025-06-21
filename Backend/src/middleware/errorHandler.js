// Backend/src/middleware/errorHandler.js - Enhanced error handler middleware

export const errorHandler = (err, req, res, next) => {
  console.error('Error caught by middleware:', err);
  
  // Default error data
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  const stack = process.env.NODE_ENV === 'production' ? '🥞' : err.stack;
    // MongoDB ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400; // Bad Request
    message = Object.values(err.errors)
      .map(item => item.message)
      .join(', ');
  }
  
  // MongoDB CastError (usually invalid ObjectID)
  if (err.name === 'CastError') {
    statusCode = 400; // Bad Request
    message = `Invalid ${err.path}: ${err.value}`;
  }
  
  // MongoDB Duplicate key error
  if (err.code && err.code === 11000) {
    statusCode = 409; // Conflict
    message = `Duplicate value entered for ${Object.keys(err.keyValue)} field`;
  }
    // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401; // Unauthorized
    message = 'Invalid token. Please log in again.';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401; // Unauthorized
    message = 'Your token has expired. Please log in again.';
  }
  
  // Return structured error response
  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : stack,
    timestamp: new Date().toISOString()
  });
};

export default errorHandler;
