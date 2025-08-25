// WhatsApp Client Errors
// Specific error types and error handling for WhatsApp Business API

export class WhatsAppError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly details?: any;
  public readonly isRetryable: boolean;

  constructor(
    message: string,
    code: string,
    options: {
      statusCode?: number;
      details?: any;
      isRetryable?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'WhatsAppError';
    this.code = code;
    this.statusCode = options.statusCode;
    this.details = options.details;
    this.isRetryable = options.isRetryable ?? false;
    
    if (options.cause) {
      (this as any).cause = options.cause;
    }
  }
}

export class WhatsAppConfigError extends WhatsAppError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIG_ERROR', { details });
    this.name = 'WhatsAppConfigError';
  }
}

export class WhatsAppValidationError extends WhatsAppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', { details });
    this.name = 'WhatsAppValidationError';
  }
}

export class WhatsAppApiError extends WhatsAppError {
  constructor(
    message: string,
    statusCode: number,
    details?: any,
    isRetryable?: boolean
  ) {
    super(message, 'API_ERROR', {
      statusCode,
      details,
      isRetryable: isRetryable ?? isRetryableStatusCode(statusCode),
    });
    this.name = 'WhatsAppApiError';
  }
}

export class WhatsAppRateLimitError extends WhatsAppError {
  constructor(message: string, retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR', {
      statusCode: 429,
      details: { retryAfter },
      isRetryable: true,
    });
    this.name = 'WhatsAppRateLimitError';
  }
}

export class WhatsAppAuthenticationError extends WhatsAppError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_ERROR', {
      statusCode: 401,
      isRetryable: false,
    });
    this.name = 'WhatsAppAuthenticationError';
  }
}

export class WhatsAppNetworkError extends WhatsAppError {
  constructor(message: string, cause?: Error) {
    super(message, 'NETWORK_ERROR', {
      isRetryable: true,
      cause,
    });
    this.name = 'WhatsAppNetworkError';
  }
}

export class WhatsAppTimeoutError extends WhatsAppError {
  constructor(message: string) {
    super(message, 'TIMEOUT_ERROR', {
      isRetryable: true,
    });
    this.name = 'WhatsAppTimeoutError';
  }
}

// Helper function to determine if a status code is retryable
export function isRetryableStatusCode(statusCode: number): boolean {
  // Retry on 5xx server errors and 429 rate limit
  return statusCode >= 500 || statusCode === 429;
}

// Helper function to create appropriate error from HTTP response
export function createErrorFromResponse(
  statusCode: number,
  errorData: any,
  originalError?: any
): WhatsAppError {
  const message = errorData?.error?.message || errorData?.message || 'Unknown error';
  const details = errorData?.error || errorData;

  switch (statusCode) {
    case 401:
      return new WhatsAppAuthenticationError(message);
    case 429:
      return new WhatsAppRateLimitError(message, errorData?.error?.retry_after);
    case 400:
      return new WhatsAppValidationError(message, details);
    case 403:
      return new WhatsAppError(message, 'FORBIDDEN_ERROR', {
        statusCode,
        details,
        isRetryable: false,
      });
    case 404:
      return new WhatsAppError(message, 'NOT_FOUND_ERROR', {
        statusCode,
        details,
        isRetryable: false,
      });
    case 408:
      return new WhatsAppTimeoutError(message);
    case 500:
    case 502:
    case 503:
    case 504:
      return new WhatsAppApiError(message, statusCode, details, true);
    default:
      return new WhatsAppApiError(message, statusCode, details);
  }
}

// Error codes for different types of errors
export const ERROR_CODES = {
  CONFIG_ERROR: 'CONFIG_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  API_ERROR: 'API_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  FORBIDDEN_ERROR: 'FORBIDDEN_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
