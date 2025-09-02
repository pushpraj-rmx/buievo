// Base error class for admin dashboard
export class AdminError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AdminError';
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date();
    this.context = context;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
    };
  }
}

// Configuration errors
export class ConfigError extends AdminError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFIG_ERROR', 500, context);
    this.name = 'ConfigError';
  }
}

export class EnvironmentError extends AdminError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'ENVIRONMENT_ERROR', 500, context);
    this.name = 'EnvironmentError';
  }
}

// Authentication and authorization errors
export class AuthenticationError extends AdminError {
  constructor(message: string = 'Authentication required', context?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', 401, context);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AdminError {
  constructor(message: string = 'Insufficient permissions', context?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_ERROR', 403, context);
    this.name = 'AuthorizationError';
  }
}

export class SessionExpiredError extends AdminError {
  constructor(message: string = 'Session has expired', context?: Record<string, unknown>) {
    super(message, 'SESSION_EXPIRED_ERROR', 401, context);
    this.name = 'SessionExpiredError';
  }
}

// API and network errors
export class ApiError extends AdminError {
  constructor(message: string, statusCode: number = 500, context?: Record<string, unknown>) {
    super(message, 'API_ERROR', statusCode, context);
    this.name = 'ApiError';
  }
}

export class NetworkError extends AdminError {
  constructor(message: string = 'Network connection failed', context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', 503, context);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends AdminError {
  constructor(message: string = 'Request timed out', context?: Record<string, unknown>) {
    super(message, 'TIMEOUT_ERROR', 408, context);
    this.name = 'TimeoutError';
  }
}

// Validation errors
export class ValidationError extends AdminError {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(
    message: string = 'Validation failed',
    fieldErrors: Record<string, string[]> = {},
    context?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', 400, context);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }

  addFieldError(field: string, error: string) {
    if (!this.fieldErrors[field]) {
      this.fieldErrors[field] = [];
    }
    this.fieldErrors[field].push(error);
  }

  hasFieldErrors(): boolean {
    return Object.keys(this.fieldErrors).length > 0;
  }
}

export class FormValidationError extends ValidationError {
  constructor(fieldErrors: Record<string, string[]>, context?: Record<string, unknown>) {
    super('Form validation failed', fieldErrors, context);
    this.name = 'FormValidationError';
  }
}

// File and media errors
export class FileError extends AdminError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'FILE_ERROR', 400, context);
    this.name = 'FileError';
  }
}

export class FileUploadError extends FileError {
  constructor(message: string = 'File upload failed', context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'FileUploadError';
  }
}

export class FileSizeError extends FileError {
  constructor(maxSize: number, actualSize: number, context?: Record<string, unknown>) {
    const message = `File size exceeds limit. Maximum: ${formatFileSize(maxSize)}, Actual: ${formatFileSize(actualSize)}`;
    super(message, context);
    this.name = 'FileSizeError';
  }
}

export class FileTypeError extends FileError {
  constructor(allowedTypes: string[], actualType: string, context?: Record<string, unknown>) {
    const message = `File type not allowed. Allowed: ${allowedTypes.join(', ')}, Actual: ${actualType}`;
    super(message, context);
    this.name = 'FileTypeError';
  }
}

// UI and component errors
export class UIError extends AdminError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'UI_ERROR', 500, context);
    this.name = 'UIError';
  }
}

export class ComponentError extends UIError {
  constructor(componentName: string, message: string, context?: Record<string, unknown>) {
    super(`Component ${componentName}: ${message}`, context);
    this.name = 'ComponentError';
  }
}

export class ThemeError extends UIError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'ThemeError';
  }
}

// State management errors
export class StateError extends AdminError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'STATE_ERROR', 500, context);
    this.name = 'StateError';
  }
}

export class StoreError extends StateError {
  constructor(storeName: string, message: string, context?: Record<string, unknown>) {
    super(`Store ${storeName}: ${message}`, context);
    this.name = 'StoreError';
  }
}

// Data and database errors
export class DataError extends AdminError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DATA_ERROR', 500, context);
    this.name = 'DataError';
  }
}

export class DatabaseError extends DataError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'DatabaseError';
  }
}

export class CacheError extends DataError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'CacheError';
  }
}

// Feature-specific errors
export class WhatsAppError extends AdminError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'WHATSAPP_ERROR', 500, context);
    this.name = 'WhatsAppError';
  }
}

export class TemplateError extends AdminError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'TEMPLATE_ERROR', 400, context);
    this.name = 'TemplateError';
  }
}

export class CampaignError extends AdminError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CAMPAIGN_ERROR', 400, context);
    this.name = 'CampaignError';
  }
}

export class MediaError extends AdminError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'MEDIA_ERROR', 400, context);
    this.name = 'MediaError';
  }
}

// Error codes enum
export const ERROR_CODES = {
  CONFIG_ERROR: 'CONFIG_ERROR',
  ENVIRONMENT_ERROR: 'ENVIRONMENT_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  SESSION_EXPIRED_ERROR: 'SESSION_EXPIRED_ERROR',
  API_ERROR: 'API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FORM_VALIDATION_ERROR: 'FORM_VALIDATION_ERROR',
  FILE_ERROR: 'FILE_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  FILE_SIZE_ERROR: 'FILE_SIZE_ERROR',
  FILE_TYPE_ERROR: 'FILE_TYPE_ERROR',
  UI_ERROR: 'UI_ERROR',
  COMPONENT_ERROR: 'COMPONENT_ERROR',
  THEME_ERROR: 'THEME_ERROR',
  STATE_ERROR: 'STATE_ERROR',
  STORE_ERROR: 'STORE_ERROR',
  DATA_ERROR: 'DATA_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  WHATSAPP_ERROR: 'WHATSAPP_ERROR',
  TEMPLATE_ERROR: 'TEMPLATE_ERROR',
  CAMPAIGN_ERROR: 'CAMPAIGN_ERROR',
  MEDIA_ERROR: 'MEDIA_ERROR',
} as const;

// Helper functions
export function isRetryableError(error: AdminError): boolean {
  const retryableCodes = [
    'NETWORK_ERROR',
    'TIMEOUT_ERROR',
    'API_ERROR',
  ];
  
  return retryableCodes.includes(error.code) || error.statusCode >= 500;
}

export function isUserError(error: AdminError): boolean {
  return error.statusCode >= 400 && error.statusCode < 500;
}

export function isServerError(error: AdminError): boolean {
  return error.statusCode >= 500;
}

export function createErrorFromApiResponse(
  response: Response,
  data?: Record<string, unknown>
): AdminError {
  const statusCode = response.status;
  const message = (data?.message as string) || `HTTP ${statusCode}: ${response.statusText}`;
  
  if (statusCode === 401) {
    return new AuthenticationError(message, { response: data });
  }
  
  if (statusCode === 403) {
    return new AuthorizationError(message, { response: data });
  }
  
  if (statusCode === 400) {
    return new ValidationError(message, (data?.fieldErrors as Record<string, string[]>) || {}, { response: data });
  }
  
  if (statusCode >= 500) {
    return new ApiError(message, statusCode, { response: data });
  }
  
  return new ApiError(message, statusCode, { response: data });
}

export function createErrorFromNetworkError(
  error: Error,
  context?: string
): AdminError {
  const message = `Network error${context ? ` in ${context}` : ''}: ${error.message}`;
  
  if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
    return new TimeoutError(message, { originalError: error.message, context });
  }
  
  return new NetworkError(message, { originalError: error.message, context });
}

export function createErrorFromValidationError(
  fieldErrors: Record<string, string[]>
): ValidationError {
  return new ValidationError('Validation failed', fieldErrors);
}

export function createErrorFromFileError(
  error: Error,
  file?: File
): FileError {
  const context = file ? { fileName: file.name, fileSize: file.size, fileType: file.type } : {};
  
  if (error.message.includes('size')) {
    return new FileSizeError(0, file?.size || 0, context);
  }
  
  if (error.message.includes('type')) {
    return new FileTypeError([], file?.type || '', context);
  }
  
  return new FileUploadError(error.message, context);
}

// Utility function for formatting file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Error boundary helper
export function getErrorBoundaryFallback(error: Error) {
  if (error instanceof AdminError) {
    return {
      title: 'Something went wrong',
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }
  
  return {
    title: 'Unexpected error',
    message: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
  };
}

// Error logging helper
export function logError(error: Error, context?: Record<string, unknown>) {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
  };
  
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('Admin Error:', errorInfo);
  }
  
  // In production, you might want to send to an error tracking service
  // like Sentry, LogRocket, etc.
  
  return errorInfo;
}
