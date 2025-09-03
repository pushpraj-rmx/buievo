// Middleware types for buievo Express.js application

// Middleware types for buievo Express.js application
// Note: Express types are optional dependencies

import type { BaseError, AuthenticationError, AuthorizationError } from './errors';

// Express-like types for middleware (fallback if express is not available)
export interface Request {
  body?: any;
  query?: any;
  params?: any;
  headers?: any;
  method?: string;
  url?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
}

export interface Response {
  status(code: number): Response;
  json(data: any): Response;
  send(data: any): Response;
  end(): Response;
}

export interface NextFunction {
  (error?: any): void;
}

// Extended Express Request with user context
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'agent' | 'admin';
    permissions?: string[];
  };
  requestId?: string;
  startTime?: number;
}

// Extended Express Response with additional methods
export interface ApiResponse extends Response {
  success?: boolean;
  error?: BaseError;
}

// Middleware function type
export type MiddlewareFunction = (
  req: AuthenticatedRequest,
  res: ApiResponse,
  next: NextFunction
) => void | Promise<void>;

// Authentication middleware types
export interface AuthMiddleware {
  authenticate: MiddlewareFunction;
  requireAuth: MiddlewareFunction;
  optionalAuth: MiddlewareFunction;
}

// Authorization middleware types
export interface AuthorizationMiddleware {
  requireRole: (roles: string | string[]) => MiddlewareFunction;
  requirePermission: (permissions: string | string[]) => MiddlewareFunction;
  requireOwnership: (resourceType: string) => MiddlewareFunction;
}

// Validation middleware types
export interface ValidationMiddleware {
  validateBody: (schema: any) => MiddlewareFunction;
  validateQuery: (schema: any) => MiddlewareFunction;
  validateParams: (schema: any) => MiddlewareFunction;
  validateHeaders: (schema: any) => MiddlewareFunction;
}

// Rate limiting middleware types
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  statusCode?: number;
  headers?: boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: AuthenticatedRequest) => string;
  handler?: (req: AuthenticatedRequest, res: ApiResponse) => void;
}

export interface RateLimitMiddleware {
  createLimiter: (config: RateLimitConfig) => MiddlewareFunction;
  createWhatsAppLimiter: () => MiddlewareFunction;
  createAuthLimiter: () => MiddlewareFunction;
}

// Logging middleware types
export interface LoggingMiddleware {
  requestLogger: MiddlewareFunction;
  errorLogger: MiddlewareFunction;
  performanceLogger: MiddlewareFunction;
}

// CORS middleware types
export interface CorsConfig {
  origin?: string | string[] | boolean | RegExp | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void);
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

// Security middleware types
export interface SecurityMiddleware {
  helmet: MiddlewareFunction;
  cors: (config?: CorsConfig) => MiddlewareFunction;
  csrf: MiddlewareFunction;
  xss: MiddlewareFunction;
  hpp: MiddlewareFunction;
}

// Cache middleware types
export interface CacheConfig {
  ttl: number;
  key?: string | ((req: AuthenticatedRequest) => string);
  condition?: (req: AuthenticatedRequest, res: ApiResponse) => boolean;
}

export interface CacheMiddleware {
  cache: (config: CacheConfig) => MiddlewareFunction;
  clearCache: (pattern?: string) => MiddlewareFunction;
}

// Error handling middleware types
export interface ErrorHandlingMiddleware {
  errorHandler: (
    error: Error | BaseError,
    req: AuthenticatedRequest,
    res: ApiResponse,
    next: NextFunction
  ) => void;
  notFoundHandler: (req: AuthenticatedRequest, res: ApiResponse) => void;
  asyncHandler: (fn: MiddlewareFunction) => MiddlewareFunction;
}

// Request context middleware types
export interface RequestContext {
  requestId: string;
  userId?: string;
  userRole?: string;
  startTime: number;
  ip: string;
  userAgent: string;
  method: string;
  path: string;
  query: Record<string, any>;
  body?: any;
}

export interface ContextMiddleware {
  addContext: MiddlewareFunction;
  getContext: () => RequestContext;
}

// File upload middleware types
export interface FileUploadConfig {
  fieldName: string;
  maxFiles?: number;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  destination?: string;
  filename?: (req: AuthenticatedRequest, file: any, callback: (error: Error | null, filename: string) => void) => void;
}

export interface FileUploadMiddleware {
  single: (fieldName: string) => MiddlewareFunction;
  array: (fieldName: string, maxCount?: number) => MiddlewareFunction;
  fields: (fields: Array<{ name: string; maxCount?: number }>) => MiddlewareFunction;
  any: () => MiddlewareFunction;
  none: () => MiddlewareFunction;
}

// Webhook middleware types
export interface WebhookConfig {
  secret: string;
  algorithm?: string;
  tolerance?: number;
}

export interface WebhookMiddleware {
  verifySignature: (config: WebhookConfig) => MiddlewareFunction;
  parseWhatsAppWebhook: MiddlewareFunction;
}

// Performance monitoring middleware types
export interface PerformanceConfig {
  enabled: boolean;
  threshold: number;
  includeHeaders?: boolean;
  includeBody?: boolean;
}

export interface PerformanceMiddleware {
  monitor: (config?: PerformanceConfig) => MiddlewareFunction;
  getMetrics: () => Record<string, any>;
}

// Health check middleware types
export interface HealthCheckConfig {
  path?: string;
  checks?: Array<{
    name: string;
    check: () => Promise<boolean>;
    timeout?: number;
  }>;
}

export interface HealthCheckMiddleware {
  healthCheck: (config?: HealthCheckConfig) => MiddlewareFunction;
}

// API documentation middleware types
export interface ApiDocsConfig {
  title: string;
  version: string;
  description?: string;
  servers?: Array<{ url: string; description?: string }>;
}

export interface ApiDocsMiddleware {
  swagger: (config?: ApiDocsConfig) => MiddlewareFunction;
  redoc: (config?: ApiDocsConfig) => MiddlewareFunction;
}

// Middleware chain type
export type MiddlewareChain = MiddlewareFunction[];

// Middleware factory type
export type MiddlewareFactory<T = any> = (config?: T) => MiddlewareFunction;

// Middleware context type
export interface MiddlewareContext {
  req: AuthenticatedRequest;
  res: ApiResponse;
  next: NextFunction;
  config?: any;
}

// Middleware error type
export interface MiddlewareError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, any>;
}

// Middleware result type
export interface MiddlewareResult {
  success: boolean;
  data?: any;
  error?: MiddlewareError;
  meta?: {
    duration: number;
    timestamp: string;
  };
}
