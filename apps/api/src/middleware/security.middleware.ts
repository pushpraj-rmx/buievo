// Security Middleware
// Security headers, rate limiting, and other security measures

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

export interface SecurityOptions {
  enableRateLimit?: boolean;
  enableHelmet?: boolean;
  enableCors?: boolean;
  corsOptions?: cors.CorsOptions;
  rateLimitOptions?: {
    windowMs?: number;
    max?: number;
    message?: string;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
  };
}

/**
 * Rate limiting middleware
 */
export function createRateLimiter(options: SecurityOptions['rateLimitOptions'] = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests from this IP, please try again later.',
    standardHeaders = true,
    legacyHeaders = false,
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_ERROR',
        message,
        statusCode: 429,
        statusText: 'Too Many Requests',
      },
    },
    standardHeaders,
    legacyHeaders,
    // Skip rate limiting for health checks
    skip: (req: any) => req.path === '/api/v1/health',
  });
}

/**
 * Security headers middleware using Helmet
 */
export function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });
}

/**
 * CORS middleware
 */
export function corsMiddleware(options: SecurityOptions['corsOptions'] = {}) {
  const defaultOptions: cors.CorsOptions = {
    origin: process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [
      'http://localhost:32100', // Admin frontend
      'http://localhost:3000',  // Web frontend
      'http://localhost:4000',  // Alternative admin port
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours
  };

  return cors({ ...defaultOptions, ...options });
}

/**
 * Request ID middleware for tracking requests
 */
export function requestIdMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.headers['x-request-id'] as string ||
      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    (req as any).requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    next();
  };
}

/**
 * Request logging middleware
 */
export function requestLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const requestId = (req as any).requestId;

    // Log request
    console.log(`[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.path}`, {
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });

    // Override res.end to log response
    const originalEnd = res.end;
    (res as any).end = function (chunk?: any, encoding?: any) {
      const duration = Date.now() - startTime;

      console.log(`[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);

      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

/**
 * API key validation middleware
 */
export function validateApiKey() {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string;
    const validApiKey = process.env.API_KEY;

    // Skip API key validation for certain routes
    const skipRoutes = ['/api/v1/health', '/api/v1/auth/login', '/api/v1/auth/register'];
    if (skipRoutes.includes(req.path)) {
      return next();
    }

    if (!validApiKey) {
      return next(); // Skip validation if no API key is configured
    }

    if (!apiKey || apiKey !== validApiKey) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Invalid API key',
          statusCode: 401,
          statusText: 'Unauthorized',
        },
      });
    }

    next();
  };
}

/**
 * Request size limiting middleware
 */
export function requestSizeLimit(maxSize: string = '10mb') {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxSizeBytes = parseSize(maxSize);

    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: `Request body too large. Maximum size is ${maxSize}`,
          statusCode: 413,
          statusText: 'Payload Too Large',
        },
      });
    }

    next();
  };
}

/**
 * Parse size string to bytes
 */
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) {
    return 1024 * 1024; // Default to 1MB
  }

  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';

  return value * units[unit];
}

/**
 * Comprehensive security middleware
 */
export function securityMiddleware(options: SecurityOptions = {}) {
  const {
    enableRateLimit = true,
    enableHelmet = true,
    enableCors = true,
    corsOptions,
    rateLimitOptions,
  } = options;

  const middlewares = [];

  // Request ID tracking
  middlewares.push(requestIdMiddleware());

  // Security headers
  if (enableHelmet) {
    middlewares.push(securityHeaders());
  }

  // CORS
  if (enableCors) {
    middlewares.push(corsMiddleware(corsOptions));
  }

  // Rate limiting
  if (enableRateLimit) {
    middlewares.push(createRateLimiter(rateLimitOptions));
  }

  // API key validation
  middlewares.push(validateApiKey());

  // Request size limiting
  middlewares.push(requestSizeLimit());

  return middlewares;
}
