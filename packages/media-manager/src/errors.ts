// Error Handling for Media Manager
// Custom error types and error handling utilities

export interface MediaErrorDetails {
  mediaId?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  maxSize?: number;
  allowedTypes?: string[];
  storageProvider?: string;
  operation?: string;
  apiResponse?: Record<string, unknown>;
  statusCode?: number;
  retryable?: boolean;
}

export interface StorageErrorDetails {
  provider?: string;
  bucket?: string;
  region?: string;
  endpoint?: string;
  operation?: string;
  errorCode?: string;
  retryable?: boolean;
}

/**
 * Base error class for media manager
 */
export class MediaManagerError extends Error {
  public readonly code: string;
  public readonly details?: MediaErrorDetails | StorageErrorDetails;
  public readonly retryable: boolean;
  public readonly statusCode?: number;

  constructor(
    message: string,
    code: string,
    options: {
      details?: MediaErrorDetails | StorageErrorDetails;
      retryable?: boolean;
      statusCode?: number;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'MediaManagerError';
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
export class MediaConfigError extends MediaManagerError {
  constructor(message: string, details?: MediaErrorDetails) {
    super(message, 'MEDIA_CONFIG_ERROR', { details });
    this.name = 'MediaConfigError';
  }
}

/**
 * Validation error
 */
export class MediaValidationError extends MediaManagerError {
  constructor(message: string, details?: MediaErrorDetails) {
    super(message, 'MEDIA_VALIDATION_ERROR', { details });
    this.name = 'MediaValidationError';
  }
}

/**
 * File size error
 */
export class MediaFileSizeError extends MediaManagerError {
  constructor(message: string, details?: MediaErrorDetails) {
    super(message, 'MEDIA_FILE_SIZE_ERROR', { details });
    this.name = 'MediaFileSizeError';
  }
}

/**
 * File type error
 */
export class MediaFileTypeError extends MediaManagerError {
  constructor(message: string, details?: MediaErrorDetails) {
    super(message, 'MEDIA_FILE_TYPE_ERROR', { details });
    this.name = 'MediaFileTypeError';
  }
}

/**
 * Storage error
 */
export class MediaStorageError extends MediaManagerError {
  constructor(message: string, details?: StorageErrorDetails) {
    super(message, 'MEDIA_STORAGE_ERROR', { details });
    this.name = 'MediaStorageError';
  }
}

/**
 * Upload error
 */
export class MediaUploadError extends MediaManagerError {
  constructor(message: string, details?: MediaErrorDetails) {
    super(message, 'MEDIA_UPLOAD_ERROR', { details });
    this.name = 'MediaUploadError';
  }
}

/**
 * Download error
 */
export class MediaDownloadError extends MediaManagerError {
  constructor(message: string, details?: MediaErrorDetails) {
    super(message, 'MEDIA_DOWNLOAD_ERROR', { details });
    this.name = 'MediaDownloadError';
  }
}

/**
 * Delete error
 */
export class MediaDeleteError extends MediaManagerError {
  constructor(message: string, details?: MediaErrorDetails) {
    super(message, 'MEDIA_DELETE_ERROR', { details });
    this.name = 'MediaDeleteError';
  }
}

/**
 * API error
 */
export class MediaApiError extends MediaManagerError {
  constructor(
    message: string,
    statusCode: number,
    details?: MediaErrorDetails,
    retryable: boolean = false
  ) {
    super(message, 'MEDIA_API_ERROR', {
      details,
      retryable,
      statusCode
    });
    this.name = 'MediaApiError';
  }
}

/**
 * Rate limit error
 */
export class MediaRateLimitError extends MediaManagerError {
  constructor(message: string, retryAfter?: number) {
    super(message, 'MEDIA_RATE_LIMIT_ERROR', {
      retryable: true,
      details: { apiResponse: { retryAfter } }
    });
    this.name = 'MediaRateLimitError';
  }
}

/**
 * Authentication error
 */
export class MediaAuthError extends MediaManagerError {
  constructor(message: string, statusCode: number = 401) {
    super(message, 'MEDIA_AUTH_ERROR', {
      retryable: false,
      statusCode
    });
    this.name = 'MediaAuthError';
  }
}

/**
 * Network error
 */
export class MediaNetworkError extends MediaManagerError {
  constructor(message: string, cause?: Error) {
    super(message, 'MEDIA_NETWORK_ERROR', {
      retryable: true,
      cause
    });
    this.name = 'MediaNetworkError';
  }
}

/**
 * Timeout error
 */
export class MediaTimeoutError extends MediaManagerError {
  constructor(message: string) {
    super(message, 'MEDIA_TIMEOUT_ERROR', { retryable: true });
    this.name = 'MediaTimeoutError';
  }
}

/**
 * File not found error
 */
export class MediaNotFoundError extends MediaManagerError {
  constructor(mediaId: string) {
    super(`Media "${mediaId}" not found`, 'MEDIA_NOT_FOUND_ERROR', {
      details: { mediaId },
      statusCode: 404,
    });
    this.name = 'MediaNotFoundError';
  }
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof MediaManagerError) {
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
    'temporary',
    'retry',
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
  operation: string,
  mediaId?: string
): MediaManagerError {
  const message = (responseData?.error as Record<string, unknown>)?.message as string || `${operation} failed`;
  const details: MediaErrorDetails = {
    mediaId,
    operation,
    apiResponse: responseData,
    statusCode,
  };

  switch (statusCode) {
    case 400:
      return new MediaValidationError(message, details);
    case 401:
      return new MediaAuthError(message, statusCode);
    case 403:
      return new MediaAuthError('Insufficient permissions', statusCode);
    case 404:
      return new MediaNotFoundError(mediaId || 'Unknown');
    case 413:
      return new MediaFileSizeError('File too large', details);
    case 429:
      return new MediaRateLimitError(message, (responseData?.error as Record<string, unknown>)?.retryAfter as number);
    case 500:
    case 502:
    case 503:
    case 504:
      return new MediaApiError(message, statusCode, details, true);
    default:
      return new MediaApiError(message, statusCode, details);
  }
}

/**
 * Create error from network error
 */
export function createErrorFromNetworkError(
  error: Error,
  operation: string
): MediaManagerError {
  const message = `${operation} failed: ${error.message}`;

  if (error.message.includes('timeout')) {
    return new MediaTimeoutError(message);
  }

  return new MediaNetworkError(message, error);
}

/**
 * Create error from file validation
 */
export function createFileValidationError(
  fileName: string,
  mimeType: string,
  fileSize: number,
  maxSize: number,
  allowedTypes: string[]
): MediaManagerError {
  if (fileSize > maxSize) {
    return new MediaFileSizeError(
      `File "${fileName}" exceeds maximum size of ${maxSize} bytes`,
      {
        fileName,
        mimeType,
        fileSize,
        maxSize,
      }
    );
  }

  if (!allowedTypes.includes(mimeType)) {
    return new MediaFileTypeError(
      `File type "${mimeType}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      {
        fileName,
        mimeType,
        allowedTypes,
      }
    );
  }

  return new MediaValidationError(
    `File "${fileName}" validation failed`,
    {
      fileName,
      mimeType,
      fileSize,
    }
  );
}

/**
 * Error codes enum
 */
export const ERROR_CODES = {
  // Configuration errors
  MEDIA_CONFIG_ERROR: 'MEDIA_CONFIG_ERROR',

  // Validation errors
  MEDIA_VALIDATION_ERROR: 'MEDIA_VALIDATION_ERROR',
  MEDIA_FILE_SIZE_ERROR: 'MEDIA_FILE_SIZE_ERROR',
  MEDIA_FILE_TYPE_ERROR: 'MEDIA_FILE_TYPE_ERROR',

  // Storage errors
  MEDIA_STORAGE_ERROR: 'MEDIA_STORAGE_ERROR',

  // Operation errors
  MEDIA_UPLOAD_ERROR: 'MEDIA_UPLOAD_ERROR',
  MEDIA_DOWNLOAD_ERROR: 'MEDIA_DOWNLOAD_ERROR',
  MEDIA_DELETE_ERROR: 'MEDIA_DELETE_ERROR',

  // API errors
  MEDIA_API_ERROR: 'MEDIA_API_ERROR',
  MEDIA_RATE_LIMIT_ERROR: 'MEDIA_RATE_LIMIT_ERROR',
  MEDIA_AUTH_ERROR: 'MEDIA_AUTH_ERROR',
  MEDIA_NOT_FOUND_ERROR: 'MEDIA_NOT_FOUND_ERROR',

  // Network errors
  MEDIA_NETWORK_ERROR: 'MEDIA_NETWORK_ERROR',
  MEDIA_TIMEOUT_ERROR: 'MEDIA_TIMEOUT_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
