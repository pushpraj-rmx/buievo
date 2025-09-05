import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

export interface SecurityMiddlewareOptions {
  enableRateLimit: boolean;
  enableHelmet: boolean;
  enableCors: boolean;
  rateLimitOptions?: {
    windowMs: number;
    max: number;
  };
}

export const securityMiddleware = (options: SecurityMiddlewareOptions) => {
  const middlewares: any[] = [];

  // Add request ID to all requests
  middlewares.push((req: Request, res: Response, next: NextFunction) => {
    (req as any).requestId = uuidv4();
    next();
  });

  // CORS middleware
  if (options.enableCors) {
    middlewares.push(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));
  }

  // Helmet middleware for security headers
  if (options.enableHelmet) {
    middlewares.push(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));
  }

  // Rate limiting middleware
  if (options.enableRateLimit) {
    const limiter = rateLimit({
      windowMs: options.rateLimitOptions?.windowMs || 15 * 60 * 1000, // 15 minutes
      max: options.rateLimitOptions?.max || 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((options.rateLimitOptions?.windowMs || 15 * 60 * 1000) / 1000),
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    middlewares.push(limiter);
  }

  return middlewares;
};

export const requestLogger = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const requestId = (req as any).requestId;

    // Log request
    console.log(`[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.path}`);

    // Log response
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    });

    next();
  };
};

