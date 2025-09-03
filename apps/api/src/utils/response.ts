// Response Utility
// Standardized API response formatting

import { Response } from 'express';
import type { 
  ApiResponse, 
  PaginatedResponse, 
  ServiceResponse,
  PaginationParams 
} from '@buievo/types';

export interface ResponseOptions {
  requestId?: string;
  timestamp?: string;
  version?: string;
}

/**
 * Generate metadata for API responses
 */
function generateMetadata(options: ResponseOptions = {}) {
  return {
    requestId: options.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: options.timestamp || new Date().toISOString(),
    version: options.version || '1.0.0',
  };
}

/**
 * Send a successful response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  options: ResponseOptions = {}
): void {
  const metadata = generateMetadata(options);
  
  const response: any = {
    success: true,
    data,
    meta: metadata,
  };

  res.status(statusCode).json(response);
}

/**
 * Send a paginated response
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: PaginationParams,
  options: ResponseOptions = {}
): void {
  const metadata = generateMetadata(options);
  
  const response: any = {
    success: true,
    data,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      total: (pagination as any).total || 0,
      totalPages: (pagination as any).totalPages || Math.ceil(((pagination as any).total || 0) / (pagination.limit || 10)),
      hasNext: (pagination as any).hasNext || ((pagination.page || 1) * (pagination.limit || 10)) < ((pagination as any).total || 0),
      hasPrev: (pagination as any).hasPrev || (pagination.page || 1) > 1,
    },
    meta: metadata,
  };

  res.status(200).json(response);
}

/**
 * Send a created response
 */
export function sendCreated<T>(
  res: Response,
  data: T,
  options: ResponseOptions = {}
): void {
  sendSuccess(res, data, 201, options);
}

/**
 * Send a no content response
 */
export function sendNoContent(
  res: Response,
  options: ResponseOptions = {}
): void {
  const metadata = generateMetadata(options);
  
  const response: any = {
    success: true,
    data: null,
    meta: metadata,
  };

  res.status(204).json(response);
}

/**
 * Send an error response
 */
export function sendError(
  res: Response,
  error: {
    code: string;
    message: string;
    statusCode?: number;
    details?: any;
  },
  options: ResponseOptions = {}
): void {
  const metadata = generateMetadata(options);
  const statusCode = error.statusCode || 500;
  
  const response: any = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
    },
    meta: metadata,
  };

  res.status(statusCode).json(response);
}

/**
 * Send a validation error response
 */
export function sendValidationError(
  res: Response,
  fieldErrors: Array<{ field: string; message: string; value?: any }>,
  options: ResponseOptions = {}
): void {
  const metadata = generateMetadata(options);
  
  const response: any = {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: { fieldErrors },
    },
    meta: metadata,
  };

  res.status(400).json(response);
}

/**
 * Send a not found response
 */
export function sendNotFound(
  res: Response,
  message: string = 'Resource not found',
  options: ResponseOptions = {}
): void {
  sendError(res, {
    code: 'NOT_FOUND_ERROR',
    message,
    statusCode: 404,
  }, options);
}

/**
 * Send an unauthorized response
 */
export function sendUnauthorized(
  res: Response,
  message: string = 'Unauthorized',
  options: ResponseOptions = {}
): void {
  sendError(res, {
    code: 'AUTHENTICATION_ERROR',
    message,
    statusCode: 401,
  }, options);
}

/**
 * Send a forbidden response
 */
export function sendForbidden(
  res: Response,
  message: string = 'Forbidden',
  options: ResponseOptions = {}
): void {
  sendError(res, {
    code: 'AUTHORIZATION_ERROR',
    message,
    statusCode: 403,
  }, options);
}

/**
 * Send a conflict response
 */
export function sendConflict(
  res: Response,
  message: string = 'Resource conflict',
  options: ResponseOptions = {}
): void {
  sendError(res, {
    code: 'CONFLICT_ERROR',
    message,
    statusCode: 409,
  }, options);
}

/**
 * Send a rate limit response
 */
export function sendRateLimit(
  res: Response,
  message: string = 'Too many requests',
  options: ResponseOptions = {}
): void {
  sendError(res, {
    code: 'RATE_LIMIT_ERROR',
    message,
    statusCode: 429,
  }, options);
}

/**
 * Send an internal server error response
 */
export function sendInternalError(
  res: Response,
  message: string = 'Internal server error',
  options: ResponseOptions = {}
): void {
  sendError(res, {
    code: 'INTERNAL_ERROR',
    message,
    statusCode: 500,
  }, options);
}

/**
 * Send a service unavailable response
 */
export function sendServiceUnavailable(
  res: Response,
  message: string = 'Service temporarily unavailable',
  options: ResponseOptions = {}
): void {
  sendError(res, {
    code: 'SERVICE_UNAVAILABLE',
    message,
    statusCode: 503,
  }, options);
}

/**
 * Helper to convert service response to API response
 */
export function sendServiceResponse<T>(
  res: Response,
  serviceResponse: ServiceResponse<T>,
  options: ResponseOptions = {}
): void {
  if (serviceResponse.pagination) {
    sendPaginated(res, serviceResponse.data as any[], serviceResponse.pagination, options);
  } else {
    sendSuccess(res, serviceResponse.data, 200, options);
  }
}
