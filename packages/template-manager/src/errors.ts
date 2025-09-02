// Error Handling for Template Manager
// Custom error types and error handling utilities

export interface TemplateErrorDetails {
  templateName?: string;
  componentType?: string;
  fieldName?: string;
  validationErrors?: string[];
  apiResponse?: Record<string, unknown>;
  statusCode?: number;
  retryable?: boolean;
}

export interface MediaErrorDetails {
  mediaId?: string;
  mediaType?: string;
  fileSize?: number;
  maxSize?: number;
  allowedTypes?: string[];
  uploadUrl?: string;
}

/**
 * Base error class for template manager
 */
export class TemplateManagerError extends Error {
  public readonly code: string;
  public readonly details?: TemplateErrorDetails | MediaErrorDetails;
  public readonly retryable: boolean;
  public readonly statusCode?: number;

  constructor(
    message: string,
    code: string,
    options: {
      details?: TemplateErrorDetails | MediaErrorDetails;
      retryable?: boolean;
      statusCode?: number;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'TemplateManagerError';
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
export class TemplateConfigError extends TemplateManagerError {
  constructor(message: string, details?: TemplateErrorDetails) {
    super(message, 'TEMPLATE_CONFIG_ERROR', { details });
    this.name = 'TemplateConfigError';
  }
}

/**
 * Validation error
 */
export class TemplateValidationError extends TemplateManagerError {
  constructor(message: string, details?: TemplateErrorDetails) {
    super(message, 'TEMPLATE_VALIDATION_ERROR', { details });
    this.name = 'TemplateValidationError';
  }
}

/**
 * API error
 */
export class TemplateApiError extends TemplateManagerError {
  constructor(
    message: string,
    statusCode: number,
    details?: TemplateErrorDetails,
    retryable: boolean = false
  ) {
    super(message, 'TEMPLATE_API_ERROR', {
      details,
      retryable,
      statusCode
    });
    this.name = 'TemplateApiError';
  }
}

/**
 * Rate limit error
 */
export class TemplateRateLimitError extends TemplateManagerError {
  constructor(message: string, retryAfter?: number) {
    super(message, 'TEMPLATE_RATE_LIMIT_ERROR', {
      retryable: true,
      details: { apiResponse: { retryAfter } }
    });
    this.name = 'TemplateRateLimitError';
  }
}

/**
 * Authentication error
 */
export class TemplateAuthError extends TemplateManagerError {
  constructor(message: string, statusCode: number = 401) {
    super(message, 'TEMPLATE_AUTH_ERROR', {
      retryable: false,
      statusCode
    });
    this.name = 'TemplateAuthError';
  }
}

/**
 * Media error
 */
export class TemplateMediaError extends TemplateManagerError {
  constructor(message: string, details?: MediaErrorDetails) {
    super(message, 'TEMPLATE_MEDIA_ERROR', { details });
    this.name = 'TemplateMediaError';
  }
}

/**
 * Template not found error
 */
export class TemplateNotFoundError extends TemplateManagerError {
  constructor(templateName: string) {
    super(`Template "${templateName}" not found`, 'TEMPLATE_NOT_FOUND_ERROR', {
      details: { templateName },
      statusCode: 404,
    });
    this.name = 'TemplateNotFoundError';
  }
}

/**
 * Template already exists error
 */
export class TemplateExistsError extends TemplateManagerError {
  constructor(templateName: string) {
    super(`Template "${templateName}" already exists`, 'TEMPLATE_EXISTS_ERROR', {
      details: { templateName },
      statusCode: 409,
    });
    this.name = 'TemplateExistsError';
  }
}

/**
 * Template approval error
 */
export class TemplateApprovalError extends TemplateManagerError {
  constructor(message: string, details?: TemplateErrorDetails) {
    super(message, 'TEMPLATE_APPROVAL_ERROR', { details });
    this.name = 'TemplateApprovalError';
  }
}

/**
 * Network error
 */
export class TemplateNetworkError extends TemplateManagerError {
  constructor(message: string, cause?: Error) {
    super(message, 'TEMPLATE_NETWORK_ERROR', {
      retryable: true,
      cause
    });
    this.name = 'TemplateNetworkError';
  }
}

/**
 * Timeout error
 */
export class TemplateTimeoutError extends TemplateManagerError {
  constructor(message: string) {
    super(message, 'TEMPLATE_TIMEOUT_ERROR', { retryable: true });
    this.name = 'TemplateTimeoutError';
  }
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof TemplateManagerError) {
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
    'rate limit',
  ];

  const errorMessage = error.message.toLowerCase();
  return retryablePatterns.some(pattern =>
    errorMessage.includes(pattern.toLowerCase())
  );
}

/**
 * Create error from API response
 */
export function createErrorFromApiResponse(
  statusCode: number,
  responseData: Record<string, unknown>,
  templateName?: string
): TemplateManagerError {
  const message = (responseData?.error as Record<string, unknown>)?.message as string || 'API request failed';
  const details: TemplateErrorDetails = {
    templateName,
    apiResponse: responseData,
    statusCode,
  };

  switch (statusCode) {
    case 400:
      return new TemplateValidationError(message, details);
    case 401:
      return new TemplateAuthError(message, statusCode);
    case 403:
      return new TemplateAuthError('Insufficient permissions', statusCode);
    case 404:
      return new TemplateNotFoundError(templateName || 'Unknown');
    case 409:
      return new TemplateExistsError(templateName || 'Unknown');
    case 429:
      return new TemplateRateLimitError(message, (responseData?.error as Record<string, unknown>)?.retryAfter as number);
    case 500:
    case 502:
    case 503:
    case 504:
      return new TemplateApiError(message, statusCode, details, true);
    default:
      return new TemplateApiError(message, statusCode, details);
  }
}

/**
 * Create error from network error
 */
export function createErrorFromNetworkError(
  error: Error,
  operation: string
): TemplateManagerError {
  const message = `${operation} failed: ${error.message}`;

  if (error.message.includes('timeout')) {
    return new TemplateTimeoutError(message);
  }

  return new TemplateNetworkError(message, error);
}

/**
 * Error codes enum
 */
export const ERROR_CODES = {
  // Configuration errors
  TEMPLATE_CONFIG_ERROR: 'TEMPLATE_CONFIG_ERROR',

  // Validation errors
  TEMPLATE_VALIDATION_ERROR: 'TEMPLATE_VALIDATION_ERROR',

  // API errors
  TEMPLATE_API_ERROR: 'TEMPLATE_API_ERROR',
  TEMPLATE_RATE_LIMIT_ERROR: 'TEMPLATE_RATE_LIMIT_ERROR',
  TEMPLATE_AUTH_ERROR: 'TEMPLATE_AUTH_ERROR',
  TEMPLATE_NOT_FOUND_ERROR: 'TEMPLATE_NOT_FOUND_ERROR',
  TEMPLATE_EXISTS_ERROR: 'TEMPLATE_EXISTS_ERROR',
  TEMPLATE_APPROVAL_ERROR: 'TEMPLATE_APPROVAL_ERROR',

  // Media errors
  TEMPLATE_MEDIA_ERROR: 'TEMPLATE_MEDIA_ERROR',

  // Network errors
  TEMPLATE_NETWORK_ERROR: 'TEMPLATE_NETWORK_ERROR',
  TEMPLATE_TIMEOUT_ERROR: 'TEMPLATE_TIMEOUT_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
