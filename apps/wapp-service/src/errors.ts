import type { WorkerError as TypesWorkerError } from './types';

// Base error class for WhatsApp service worker
export class WappServiceError extends Error {
  public readonly code: string;
  public readonly retryable: boolean;
  public readonly timestamp: Date;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    retryable: boolean = false,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'WappServiceError';
    this.code = code;
    this.retryable = retryable;
    this.timestamp = new Date();
    this.details = details;
  }

  toWorkerError(): TypesWorkerError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      retryable: this.retryable,
      timestamp: this.timestamp,
    };
  }
}

// Configuration errors
export class ConfigError extends WappServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIG_ERROR', false, details);
    this.name = 'ConfigError';
  }
}

export class EnvironmentError extends WappServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'ENVIRONMENT_ERROR', false, details);
    this.name = 'EnvironmentError';
  }
}

// Job processing errors
export class JobProcessingError extends WappServiceError {
  constructor(message: string, retryable: boolean = false, details?: Record<string, unknown>) {
    super(message, 'JOB_PROCESSING_ERROR', retryable, details);
    this.name = 'JobProcessingError';
  }
}

export class JobValidationError extends WappServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'JOB_VALIDATION_ERROR', false, details);
    this.name = 'JobValidationError';
  }
}

export class JobTimeoutError extends WappServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'JOB_TIMEOUT_ERROR', true, details);
    this.name = 'JobTimeoutError';
  }
}

export class JobRetryLimitExceededError extends WappServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'JOB_RETRY_LIMIT_EXCEEDED', false, details);
    this.name = 'JobRetryLimitExceededError';
  }
}

// Contact and phone number errors
export class ContactNotFoundError extends WappServiceError {
  constructor(contactId: string, details?: Record<string, unknown>) {
    super(`Contact not found: ${contactId}`, 'CONTACT_NOT_FOUND', false, details);
    this.name = 'ContactNotFoundError';
  }
}

export class PhoneNumberNotFoundError extends WappServiceError {
  constructor(contactId: string, details?: Record<string, unknown>) {
    super(`Phone number not found for contact: ${contactId}`, 'PHONE_NUMBER_NOT_FOUND', false, details);
    this.name = 'PhoneNumberNotFoundError';
  }
}

export class InvalidPhoneNumberError extends WappServiceError {
  constructor(phoneNumber: string, details?: Record<string, unknown>) {
    super(`Invalid phone number: ${phoneNumber}`, 'INVALID_PHONE_NUMBER', false, details);
    this.name = 'InvalidPhoneNumberError';
  }
}

// WhatsApp API errors
export class WhatsAppApiError extends WappServiceError {
  constructor(message: string, retryable: boolean = false, details?: Record<string, unknown>) {
    super(message, 'WHATSAPP_API_ERROR', retryable, details);
    this.name = 'WhatsAppApiError';
  }
}

export class WhatsAppAuthError extends WappServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'WHATSAPP_AUTH_ERROR', false, details);
    this.name = 'WhatsAppAuthError';
  }
}

export class WhatsAppRateLimitError extends WappServiceError {
  constructor(message: string, retryAfter?: number, details?: Record<string, unknown>) {
    super(message, 'WHATSAPP_RATE_LIMIT_ERROR', true, {
      retryAfter,
      ...details,
    });
    this.name = 'WhatsAppRateLimitError';
  }
}

export class WhatsAppTemplateError extends WappServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'WHATSAPP_TEMPLATE_ERROR', false, details);
    this.name = 'WhatsAppTemplateError';
  }
}

// Queue and Redis errors
export class QueueError extends WappServiceError {
  constructor(message: string, retryable: boolean = false, details?: Record<string, unknown>) {
    super(message, 'QUEUE_ERROR', retryable, details);
    this.name = 'QueueError';
  }
}

export class RedisConnectionError extends WappServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'REDIS_CONNECTION_ERROR', true, details);
    this.name = 'RedisConnectionError';
  }
}

export class MessageParseError extends WappServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'MESSAGE_PARSE_ERROR', false, details);
    this.name = 'MessageParseError';
  }
}

// Worker errors
export class WorkerErrorClass extends WappServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'WORKER_ERROR', false, details);
    this.name = 'WorkerError';
  }
}

export class WorkerStartupError extends WappServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'WORKER_STARTUP_ERROR', false, details);
    this.name = 'WorkerStartupError';
  }
}

export class WorkerShutdownError extends WappServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'WORKER_SHUTDOWN_ERROR', false, details);
    this.name = 'WorkerShutdownError';
  }
}

// Database errors
export class DatabaseError extends WappServiceError {
  constructor(message: string, retryable: boolean = false, details?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', retryable, details);
    this.name = 'DatabaseError';
  }
}

export class DatabaseConnectionError extends WappServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'DATABASE_CONNECTION_ERROR', true, details);
    this.name = 'DatabaseConnectionError';
  }
}

// Error codes enum
export const ERROR_CODES = {
  CONFIG_ERROR: 'CONFIG_ERROR',
  ENVIRONMENT_ERROR: 'ENVIRONMENT_ERROR',
  JOB_PROCESSING_ERROR: 'JOB_PROCESSING_ERROR',
  JOB_VALIDATION_ERROR: 'JOB_VALIDATION_ERROR',
  JOB_TIMEOUT_ERROR: 'JOB_TIMEOUT_ERROR',
  JOB_RETRY_LIMIT_EXCEEDED: 'JOB_RETRY_LIMIT_EXCEEDED',
  CONTACT_NOT_FOUND: 'CONTACT_NOT_FOUND',
  PHONE_NUMBER_NOT_FOUND: 'PHONE_NUMBER_NOT_FOUND',
  INVALID_PHONE_NUMBER: 'INVALID_PHONE_NUMBER',
  WHATSAPP_API_ERROR: 'WHATSAPP_API_ERROR',
  WHATSAPP_AUTH_ERROR: 'WHATSAPP_AUTH_ERROR',
  WHATSAPP_RATE_LIMIT_ERROR: 'WHATSAPP_RATE_LIMIT_ERROR',
  WHATSAPP_TEMPLATE_ERROR: 'WHATSAPP_TEMPLATE_ERROR',
  QUEUE_ERROR: 'QUEUE_ERROR',
  REDIS_CONNECTION_ERROR: 'REDIS_CONNECTION_ERROR',
  MESSAGE_PARSE_ERROR: 'MESSAGE_PARSE_ERROR',
  WORKER_ERROR: 'WORKER_ERROR',
  WORKER_STARTUP_ERROR: 'WORKER_STARTUP_ERROR',
  WORKER_SHUTDOWN_ERROR: 'WORKER_SHUTDOWN_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
} as const;

// Helper functions
export function isRetryableError(error: WappServiceError): boolean {
  return error.retryable;
}

export function createErrorFromWhatsAppResponse(
  response: Record<string, unknown>,
  defaultMessage: string = 'WhatsApp API error'
): WappServiceError {
  const errorCode = (response.error as Record<string, unknown>)?.code as string;
  const errorMessage = (response.error as Record<string, unknown>)?.message as string || defaultMessage;
  const retryAfter = (response.error as Record<string, unknown>)?.retryAfter as number;

  if (errorCode === 'rate_limit') {
    return new WhatsAppRateLimitError(errorMessage, retryAfter, { response });
  }

  if (errorCode === 'auth_error' || errorCode === 'unauthorized') {
    return new WhatsAppAuthError(errorMessage, { response });
  }

  if (errorCode === 'template_error' || errorCode === 'invalid_template') {
    return new WhatsAppTemplateError(errorMessage, { response });
  }

  // Check if it's retryable based on HTTP status code
  const statusCode = response.status as number;
  const isRetryable = statusCode >= 500 || statusCode === 429;

  return new WhatsAppApiError(errorMessage, isRetryable, { response });
}

export function createErrorFromNetworkError(
  error: Error,
  context: string
): WappServiceError {
  const message = `Network error in ${context}: ${error.message}`;
  
  // Determine if it's retryable based on error type
  const isRetryable = error.name === 'TimeoutError' || 
                     error.message.includes('timeout') ||
                     error.message.includes('ECONNRESET') ||
                     error.message.includes('ENOTFOUND');

  return new WhatsAppApiError(message, isRetryable, { 
    originalError: error.message,
    context 
  });
}

export function createErrorFromDatabaseError(
  error: Error,
  operation: string
): WappServiceError {
  const message = `Database error during ${operation}: ${error.message}`;
  
  const isRetryable = error.message.includes('connection') ||
                     error.message.includes('timeout') ||
                     error.message.includes('ECONNRESET');

  return new DatabaseError(message, isRetryable, {
    originalError: error.message,
    operation
  });
}

export function createErrorFromRedisError(
  error: Error,
  operation: string
): WappServiceError {
  const message = `Redis error during ${operation}: ${error.message}`;
  
  const isRetryable = error.message.includes('connection') ||
                     error.message.includes('timeout') ||
                     error.message.includes('ECONNRESET');

  return new RedisConnectionError(message, {
    originalError: error.message,
    operation
  });
}
