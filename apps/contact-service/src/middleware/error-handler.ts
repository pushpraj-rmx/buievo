import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Don't leak error details in production
  const errorResponse: {
    error: {
      message: string;
      statusCode: number;
      timestamp: string;
      path: string;
      stack?: string;
    };
  } = {
    error: {
      message: statusCode === 500 ? "Internal Server Error" : message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.url,
    },
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === "development") {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
