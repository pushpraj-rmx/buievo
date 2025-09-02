// Validation Middleware
// Request validation using Zod schemas

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import type { ValidationError } from '@whatssuite/types';

export interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
}

/**
 * Format Zod validation errors for API response
 */
function formatValidationErrors(error: ZodError): ValidationError {
  const fieldErrors = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    value: (err as any).received,
  }));

  return {
    code: 'VALIDATION_ERROR',
    message: 'Request validation failed',
    statusCode: 400,
    statusText: 'Bad Request',
    fieldErrors,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validate request data against Zod schema
 */
function validateData<T>(schema: ZodSchema, data: any): { success: true; data: T } | { success: false; error: ValidationError } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: formatValidationErrors(error) };
    }
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation processing error',
        statusCode: 400,
        statusText: 'Bad Request',
        fieldErrors: [],
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Validation middleware factory
 */
export function validate(options: ValidationOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: ValidationError[] = [];

      // Validate body
      if (options.body && req.body) {
        const result = validateData(options.body, req.body);
        if (!result.success) {
          errors.push(result.error);
        } else {
          req.body = result.data;
        }
      }

      // Validate query parameters
      if (options.query && req.query) {
        const result = validateData(options.query, req.query);
        if (!result.success) {
          errors.push(result.error);
        } else {
          (req as any).query = result.data;
        }
      }

      // Validate URL parameters
      if (options.params && req.params) {
        const result = validateData(options.params, req.params);
        if (!result.success) {
          errors.push(result.error);
        } else {
          (req as any).params = result.data;
        }
      }

      // Validate headers
      if (options.headers && req.headers) {
        const result = validateData(options.headers, req.headers);
        if (!result.success) {
          errors.push(result.error);
        } else {
          (req as any).headers = result.data;
        }
      }

      // If there are validation errors, return them
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: errors[0], // Return the first error for simplicity
        });
      }

      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Validation processing error',
        },
      });
    }
  };
}

/**
 * Body validation middleware
 */
export function validateBody(schema: ZodSchema) {
  return validate({ body: schema });
}

/**
 * Query validation middleware
 */
export function validateQuery(schema: ZodSchema) {
  return validate({ query: schema });
}

/**
 * Params validation middleware
 */
export function validateParams(schema: ZodSchema) {
  return validate({ params: schema });
}

/**
 * Headers validation middleware
 */
export function validateHeaders(schema: ZodSchema) {
  return validate({ headers: schema });
}

// Common validation schemas
export const commonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)),
    limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(100)),
  }),

  // UUID parameter
  uuidParam: z.object({
    id: z.string().uuid('Invalid UUID format'),
  }),

  // Search query
  searchQuery: z.object({
    search: z.string().optional(),
    status: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),

  // Date range
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
};
