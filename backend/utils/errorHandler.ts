import { Response } from "express";

// Custom error classes
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string) {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

// Error response formatter
export const errorResponse = (res: Response, error: any) => {
  // Default error values
  let statusCode = 500;
  let message = "Internal server error";
  let errorType = "error";
  let details = null;

  // Handle known error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errorType = error.status;
  } else if (error.name === "SequelizeValidationError") {
    statusCode = 400;
    message = "Validation error";
    errorType = "fail";
    details = error.errors.map((err: any) => ({
      field: err.path,
      message: err.message,
    }));
  } else if (error.name === "SequelizeUniqueConstraintError") {
    statusCode = 409;
    message = "Duplicate entry error";
    errorType = "fail";
    details = error.errors.map((err: any) => ({
      field: err.path,
      message: err.message,
    }));
  } else if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
    errorType = "fail";
  } else if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
    errorType = "fail";
  } else if (error.name === "SequelizeConnectionError") {
    statusCode = 500;
    message = "Database connection error";
    errorType = "error";
  }

  // Send formatted response
  return res.status(statusCode).json({
    status: errorType,
    message,
    ...(details && { details }),
  });
};
