// Error Handling Middleware
// Centralized error handling and response formatting

import { Request, Response, NextFunction } from 'express';
import type { 
  BaseError, 
  ValidationError, 
  ConflictError, 
  NotFoundError, 
  AuthenticationError, 
  AuthorizationError,
  InternalServerError 
} from '@buievo/types';

export interface ErrorResponse {
  success: false;
  error: BaseError;
  meta?: {
    requestId: string;
    timestamp: string;
    path: string;
    method: string;
  };
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format error for API response
 */
function formatError(error: any, req: Request): ErrorResponse {
  const requestId = (req as any).requestId || generateRequestId();
  const timestamp = new Date().toISOString();
  const path = req.path;
  const method = req.method;

  // Handle known error types
  if (error.statusCode) {
          return {
        success: false,
        error: {
          code: error.code || 'API_ERROR',
          message: error.message || 'An error occurred',
          details: error.details,
          timestamp,
          path,
          method,
          requestId,
          ...(error.statusCode && { statusCode: error.statusCode }),
          ...(error.statusText && { statusText: error.statusText }),
        },
        meta: {
          requestId,
          timestamp,
          path,
          method,
        },
      };
  }

  // Handle validation errors
  if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
    const validationError: ValidationError = {
      code: 'VALIDATION_ERROR',
      message: error.message || 'Validation failed',
      statusCode: 400,
      statusText: 'Bad Request',
      fieldErrors: error.fieldErrors || [],
      timestamp,
      path,
      method,
      requestId,
    };

    return {
      success: false,
      error: validationError,
      meta: {
        requestId,
        timestamp,
        path,
        method,
      },
    };
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    const unauthorizedError: AuthenticationError = {
      code: 'AUTHENTICATION_ERROR',
      message: 'Invalid token',
      statusCode: 401,
      statusText: 'Unauthorized',
      timestamp,
      path,
      method,
      requestId,
    };

    return {
      success: false,
      error: unauthorizedError,
      meta: {
        requestId,
        timestamp,
        path,
        method,
      },
    };
  }

  // Handle Prisma errors
  if (error.code === 'P2002') {
    const conflictError: ConflictError = {
      code: 'CONFLICT_ERROR',
      message: 'Resource already exists',
      statusCode: 409,
      statusText: 'Conflict',
      conflictingField: error.meta?.target?.[0],
      timestamp,
      path,
      method,
      requestId,
    };

    return {
      success: false,
      error: conflictError,
      meta: {
        requestId,
        timestamp,
        path,
        method,
      },
    };
  }

  if (error.code === 'P2025') {
    const notFoundError: NotFoundError = {
      code: 'NOT_FOUND_ERROR',
      message: 'Resource not found',
      statusCode: 404,
      statusText: 'Not Found',
      timestamp,
      path,
      method,
      requestId,
    };

    return {
      success: false,
      error: notFoundError,
      meta: {
        requestId,
        timestamp,
        path,
        method,
      },
    };
  }

  // Default internal server error
  const internalError: InternalServerError = {
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message || 'An unexpected error occurred',
    statusCode: 500,
    statusText: 'Internal Server Error',
    details: process.env.NODE_ENV === 'production' ? undefined : {
      stack: error.stack,
      name: error.name,
    },
    timestamp,
    path,
    method,
    requestId,
  };

  return {
    success: false,
    error: internalError,
    meta: {
      requestId,
      timestamp,
      path,
      method,
    },
  };
}

/**
 * Error handling middleware
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  console.error('API Error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    user: (req as any).user?.id,
  });

  // Format the error response
  const errorResponse = formatError(error, req);
  const statusCode = (errorResponse.error as any).statusCode || 500;

  // Send the error response
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  const requestId = (req as any).requestId || generateRequestId();
  const timestamp = new Date().toISOString();

  const notFoundError: NotFoundError = {
    code: 'NOT_FOUND_ERROR',
    message: `Route ${req.method} ${req.path} not found`,
    statusCode: 404,
    statusText: 'Not Found',
    timestamp,
    path: req.path,
    method: req.method,
    requestId,
  };

  res.status(404).json({
    success: false,
    error: notFoundError,
    meta: {
      requestId,
      timestamp,
      path: req.path,
      method: req.method,
    },
  });
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}


