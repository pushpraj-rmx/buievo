// Error Handling for Redis Module
// Custom error types and error handling utilities

export interface RedisErrorDetails {
  operation?: string;
  key?: string;
  command?: string;
  connectionUrl?: string;
  retryAttempt?: number;
  maxRetries?: number;
  timeout?: number;
  errorCode?: string;
  retryable?: boolean;
}

export interface ConnectionErrorDetails {
  host?: string;
  port?: number;
  database?: number;
  endpoint?: string;
  operation?: string;
  errorCode?: string;
  retryable?: boolean;
}

/**
 * Base error class for Redis module
 */
export class RedisModuleError extends Error {
  public readonly code: string;
  public readonly details?: RedisErrorDetails | ConnectionErrorDetails;
  public readonly retryable: boolean;
  public readonly statusCode?: number;

  constructor(
    message: string,
    code: string,
    options: {
      details?: RedisErrorDetails | ConnectionErrorDetails;
      retryable?: boolean;
      statusCode?: number;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'RedisModuleError';
    this.code = code;
    this.details = options.details;
    this.retryable = options.retryable ?? false;
    this.statusCode = options.statusCode;

    if (options.cause) {
      (this as unknown as { cause: Error }).cause = options.cause;
    }
  }
}

/**
 * Configuration error
 */
export class RedisConfigError extends RedisModuleError {
  constructor(message: string, details?: RedisErrorDetails) {
    super(message, 'REDIS_CONFIG_ERROR', { details });
    this.name = 'RedisConfigError';
  }
}

/**
 * Connection error
 */
export class RedisConnectionError extends RedisModuleError {
  constructor(message: string, details?: ConnectionErrorDetails) {
    super(message, 'REDIS_CONNECTION_ERROR', { 
      details,
      retryable: true 
    });
    this.name = 'RedisConnectionError';
  }
}

/**
 * Authentication error
 */
export class RedisAuthError extends RedisModuleError {
  constructor(message: string, details?: ConnectionErrorDetails) {
    super(message, 'REDIS_AUTH_ERROR', { 
      details,
      retryable: false 
    });
    this.name = 'RedisAuthError';
  }
}

/**
 * Timeout error
 */
export class RedisTimeoutError extends RedisModuleError {
  constructor(message: string, details?: RedisErrorDetails) {
    super(message, 'REDIS_TIMEOUT_ERROR', { 
      details,
      retryable: true 
    });
    this.name = 'RedisTimeoutError';
  }
}

/**
 * Command error
 */
export class RedisCommandError extends RedisModuleError {
  constructor(message: string, details?: RedisErrorDetails) {
    super(message, 'REDIS_COMMAND_ERROR', { details });
    this.name = 'RedisCommandError';
  }
}

/**
 * Key not found error
 */
export class RedisKeyNotFoundError extends RedisModuleError {
  constructor(key: string, details?: RedisErrorDetails) {
    super(`Key "${key}" not found`, 'REDIS_KEY_NOT_FOUND_ERROR', {
      details: { ...details, key },
      retryable: false,
    });
    this.name = 'RedisKeyNotFoundError';
  }
}

/**
 * Key exists error
 */
export class RedisKeyExistsError extends RedisModuleError {
  constructor(key: string, details?: RedisErrorDetails) {
    super(`Key "${key}" already exists`, 'REDIS_KEY_EXISTS_ERROR', {
      details: { ...details, key },
      retryable: false,
    });
    this.name = 'RedisKeyExistsError';
  }
}

/**
 * Memory error
 */
export class RedisMemoryError extends RedisModuleError {
  constructor(message: string, details?: RedisErrorDetails) {
    super(message, 'REDIS_MEMORY_ERROR', { 
      details,
      retryable: true 
    });
    this.name = 'RedisMemoryError';
  }
}

/**
 * Network error
 */
export class RedisNetworkError extends RedisModuleError {
  constructor(message: string, cause?: Error) {
    super(message, 'REDIS_NETWORK_ERROR', {
      retryable: true,
      cause
    });
    this.name = 'RedisNetworkError';
  }
}

/**
 * Serialization error
 */
export class RedisSerializationError extends RedisModuleError {
  constructor(message: string, details?: RedisErrorDetails) {
    super(message, 'REDIS_SERIALIZATION_ERROR', { details });
    this.name = 'RedisSerializationError';
  }
}

/**
 * Deserialization error
 */
export class RedisDeserializationError extends RedisModuleError {
  constructor(message: string, details?: RedisErrorDetails) {
    super(message, 'REDIS_DESERIALIZATION_ERROR', { details });
    this.name = 'RedisDeserializationError';
  }
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof RedisModuleError) {
    return error.retryable;
  }

  // Check for common retryable error patterns
  const retryablePatterns = [
    'ECONNRESET',
    'ENOTFOUND',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'network',
    'timeout',
    'connection',
    'temporary',
    'retry',
    'memory',
    'OOM',
  ];

  const errorMessage = error.message.toLowerCase();
  return retryablePatterns.some(pattern =>
    errorMessage.includes(pattern.toLowerCase())
  );
}

/**
 * Create error from Redis error
 */
export function createErrorFromRedisError(
  error: Error,
  operation: string,
  key?: string
): RedisModuleError {
  const message = `${operation} failed: ${error.message}`;
  const details: RedisErrorDetails = {
    operation,
    key,
    errorCode: error.name,
  };

  // Check for specific Redis error patterns
  if (error.message.includes('WRONGTYPE')) {
    return new RedisCommandError(`Wrong type for key "${key}"`, details);
  }

  if (error.message.includes('NOAUTH')) {
    return new RedisAuthError('Authentication required', {
      operation,
      errorCode: error.name,
    });
  }

  if (error.message.includes('timeout')) {
    return new RedisTimeoutError(message, details);
  }

  if (error.message.includes('connection')) {
    return new RedisConnectionError(message, {
      operation,
      errorCode: error.name,
    });
  }

  if (error.message.includes('OOM') || error.message.includes('memory')) {
    return new RedisMemoryError(message, details);
  }

  if (error.message.includes('network')) {
    return new RedisNetworkError(message, error);
  }

  // Default to command error
  return new RedisCommandError(message, details);
}

/**
 * Create connection error
 */
export function createConnectionError(
  error: Error,
  connectionUrl?: string
): RedisConnectionError {
  const message = `Redis connection failed: ${error.message}`;
  const details: ConnectionErrorDetails = {
    endpoint: connectionUrl,
    errorCode: error.name,
  };

  return new RedisConnectionError(message, details);
}

/**
 * Error codes enum
 */
export const ERROR_CODES = {
  // Configuration errors
  REDIS_CONFIG_ERROR: 'REDIS_CONFIG_ERROR',

  // Connection errors
  REDIS_CONNECTION_ERROR: 'REDIS_CONNECTION_ERROR',
  REDIS_AUTH_ERROR: 'REDIS_AUTH_ERROR',
  REDIS_TIMEOUT_ERROR: 'REDIS_TIMEOUT_ERROR',

  // Command errors
  REDIS_COMMAND_ERROR: 'REDIS_COMMAND_ERROR',
  REDIS_KEY_NOT_FOUND_ERROR: 'REDIS_KEY_NOT_FOUND_ERROR',
  REDIS_KEY_EXISTS_ERROR: 'REDIS_KEY_EXISTS_ERROR',

  // System errors
  REDIS_MEMORY_ERROR: 'REDIS_MEMORY_ERROR',
  REDIS_NETWORK_ERROR: 'REDIS_NETWORK_ERROR',

  // Data errors
  REDIS_SERIALIZATION_ERROR: 'REDIS_SERIALIZATION_ERROR',
  REDIS_DESERIALIZATION_ERROR: 'REDIS_DESERIALIZATION_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
