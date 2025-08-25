// Error handling types for WhatsSuite

// Base error interface
export interface BaseError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  path?: string;
  method?: string;
  userId?: string;
  requestId?: string;
}

// HTTP error types
export interface HttpError extends BaseError {
  statusCode: number;
  statusText: string;
}

// Validation error types
export interface ValidationError extends BaseError {
  code: 'VALIDATION_ERROR';
  statusCode: 400;
  statusText: 'Bad Request';
  fieldErrors: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

// Authentication error types
export interface AuthenticationError extends BaseError {
  code: 'AUTHENTICATION_ERROR';
  statusCode: 401;
  statusText: 'Unauthorized';
  reason?: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'MISSING_TOKEN' | 'INVALID_CREDENTIALS';
}

// Authorization error types
export interface AuthorizationError extends BaseError {
  code: 'AUTHORIZATION_ERROR';
  statusCode: 403;
  statusText: 'Forbidden';
  requiredRole?: string;
  requiredPermission?: string;
}

// Not found error types
export interface NotFoundError extends BaseError {
  code: 'NOT_FOUND_ERROR';
  statusCode: 404;
  statusText: 'Not Found';
  resource?: string;
  resourceId?: string;
}

// Conflict error types
export interface ConflictError extends BaseError {
  code: 'CONFLICT_ERROR';
  statusCode: 409;
  statusText: 'Conflict';
  conflictingField?: string;
  conflictingValue?: any;
}

// Rate limit error types
export interface RateLimitError extends BaseError {
  code: 'RATE_LIMIT_ERROR';
  statusCode: 429;
  statusText: 'Too Many Requests';
  retryAfter?: number;
  limit?: number;
  window?: number;
}

// WhatsApp API error types
export interface WhatsAppError extends BaseError {
  code: 'WHATSAPP_API_ERROR';
  statusCode: number;
  statusText: string;
  whatsappErrorCode?: string;
  whatsappErrorMessage?: string;
  retryable?: boolean;
}

// Database error types
export interface DatabaseError extends BaseError {
  code: 'DATABASE_ERROR';
  statusCode: 500;
  statusText: 'Internal Server Error';
  operation?: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  table?: string;
  constraint?: string;
}

// Media processing error types
export interface MediaError extends BaseError {
  code: 'MEDIA_ERROR';
  statusCode: 400;
  statusText: 'Bad Request';
  mediaType?: string;
  fileSize?: number;
  maxSize?: number;
  allowedTypes?: string[];
}

// Template error types
export interface TemplateError extends BaseError {
  code: 'TEMPLATE_ERROR';
  statusCode: 400;
  statusText: 'Bad Request';
  templateName?: string;
  componentType?: string;
  validationErrors?: string[];
}

// Campaign error types
export interface CampaignError extends BaseError {
  code: 'CAMPAIGN_ERROR';
  statusCode: 400;
  statusText: 'Bad Request';
  campaignId?: string;
  campaignStatus?: string;
  reason?: 'INVALID_SCHEDULE' | 'NO_CONTACTS' | 'TEMPLATE_NOT_APPROVED' | 'RATE_LIMITED';
}

// Webhook error types
export interface WebhookError extends BaseError {
  code: 'WEBHOOK_ERROR';
  statusCode: 400;
  statusText: 'Bad Request';
  webhookType?: string;
  signature?: string;
  payload?: any;
}

// Internal server error types
export interface InternalServerError extends BaseError {
  code: 'INTERNAL_SERVER_ERROR';
  statusCode: 500;
  statusText: 'Internal Server Error';
  stack?: string;
  environment?: 'development' | 'production';
}

// Service unavailable error types
export interface ServiceUnavailableError extends BaseError {
  code: 'SERVICE_UNAVAILABLE_ERROR';
  statusCode: 503;
  statusText: 'Service Unavailable';
  service?: string;
  retryAfter?: number;
}

// Error response for API endpoints
export interface ErrorResponse {
  success: false;
  error: BaseError;
  meta?: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}

// Error codes enum
export enum ErrorCode {
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Authentication errors
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  MISSING_TOKEN = 'MISSING_TOKEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Authorization errors
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Not found errors
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  
  // Conflict errors
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // Rate limit errors
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  
  // WhatsApp errors
  WHATSAPP_API_ERROR = 'WHATSAPP_API_ERROR',
  WHATSAPP_RATE_LIMIT = 'WHATSAPP_RATE_LIMIT',
  WHATSAPP_TEMPLATE_REJECTED = 'WHATSAPP_TEMPLATE_REJECTED',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  
  // Media errors
  MEDIA_ERROR = 'MEDIA_ERROR',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  
  // Template errors
  TEMPLATE_ERROR = 'TEMPLATE_ERROR',
  TEMPLATE_VALIDATION_FAILED = 'TEMPLATE_VALIDATION_FAILED',
  
  // Campaign errors
  CAMPAIGN_ERROR = 'CAMPAIGN_ERROR',
  CAMPAIGN_SCHEDULING_ERROR = 'CAMPAIGN_SCHEDULING_ERROR',
  
  // Webhook errors
  WEBHOOK_ERROR = 'WEBHOOK_ERROR',
  WEBHOOK_SIGNATURE_INVALID = 'WEBHOOK_SIGNATURE_INVALID',
  
  // Internal errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE_ERROR = 'SERVICE_UNAVAILABLE_ERROR',
}

// Error factory function type
export type ErrorFactory = (message: string, details?: Record<string, any>) => BaseError;

// Error handler function type
export type ErrorHandler = (error: Error | BaseError, context?: Record<string, any>) => ErrorResponse;
