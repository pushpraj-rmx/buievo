// Web App Error Handling
// This file contains custom error classes and error handling utilities for the web app

// Base error class for web app
export class WebError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly retryable: boolean;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    retryable: boolean = false,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'WebError';
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.context = context;
    this.timestamp = new Date();
  }
}

// Configuration errors
export class ConfigError extends WebError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFIG_ERROR', 500, false, context);
    this.name = 'ConfigError';
  }
}

// Authentication errors
export class AuthenticationError extends WebError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', 401, false, context);
    this.name = 'AuthenticationError';
  }
}

// Authorization errors
export class AuthorizationError extends WebError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_ERROR', 403, false, context);
    this.name = 'AuthorizationError';
  }
}

// API errors
export class ApiError extends WebError {
  constructor(message: string, statusCode: number, context?: Record<string, unknown>) {
    super(message, 'API_ERROR', statusCode, statusCode >= 500, context);
    this.name = 'ApiError';
  }
}

// Validation errors
export class ValidationError extends WebError {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(
    message: string,
    fieldErrors: Record<string, string[]> = {},
    context?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', 400, false, context);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

// File errors
export class FileError extends WebError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'FILE_ERROR', 400, false, context);
    this.name = 'FileError';
  }
}

export class FileSizeError extends FileError {
  constructor(maxSize: number, actualSize: number, context?: Record<string, unknown>) {
    const message = `File size (${actualSize} bytes) exceeds maximum allowed size (${maxSize} bytes)`;
    super(message, { ...context, maxSize, actualSize });
    this.name = 'FileSizeError';
  }
}

export class FileTypeError extends FileError {
  constructor(allowedTypes: string[], actualType: string, context?: Record<string, unknown>) {
    const message = `File type "${actualType}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`;
    super(message, { ...context, allowedTypes, actualType });
    this.name = 'FileTypeError';
  }
}

export class FileUploadError extends FileError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'FileUploadError';
  }
}

// UI errors
export class UIError extends WebError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'UI_ERROR', 500, false, context);
    this.name = 'UIError';
  }
}

// State errors
export class StateError extends WebError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'STATE_ERROR', 500, false, context);
    this.name = 'StateError';
  }
}

// Data errors
export class DataError extends WebError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DATA_ERROR', 500, false, context);
    this.name = 'DataError';
  }
}

// Network errors
export class NetworkError extends WebError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', 0, true, context);
    this.name = 'NetworkError';
  }
}

// Timeout errors
export class TimeoutError extends WebError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'TIMEOUT_ERROR', 408, true, context);
    this.name = 'TimeoutError';
  }
}

// WhatsApp specific errors
export class WhatsAppError extends WebError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'WHATSAPP_ERROR', 500, true, context);
    this.name = 'WhatsAppError';
  }
}

// Error codes enum
export enum ERROR_CODES {
  // Configuration errors
  CONFIG_MISSING = 'CONFIG_MISSING',
  CONFIG_INVALID = 'CONFIG_INVALID',
  CONFIG_LOAD_FAILED = 'CONFIG_LOAD_FAILED',

  // Authentication errors
  AUTH_TOKEN_MISSING = 'AUTH_TOKEN_MISSING',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND',
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',

  // Authorization errors
  AUTHZ_INSUFFICIENT_PERMISSIONS = 'AUTHZ_INSUFFICIENT_PERMISSIONS',
  AUTHZ_RESOURCE_ACCESS_DENIED = 'AUTHZ_RESOURCE_ACCESS_DENIED',
  AUTHZ_ROLE_REQUIRED = 'AUTHZ_ROLE_REQUIRED',

  // API errors
  API_REQUEST_FAILED = 'API_REQUEST_FAILED',
  API_RESPONSE_INVALID = 'API_RESPONSE_INVALID',
  API_RATE_LIMITED = 'API_RATE_LIMITED',
  API_SERVICE_UNAVAILABLE = 'API_SERVICE_UNAVAILABLE',

  // Validation errors
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  VALIDATION_LENGTH_EXCEEDED = 'VALIDATION_LENGTH_EXCEEDED',
  VALIDATION_INVALID_VALUE = 'VALIDATION_INVALID_VALUE',

  // File errors
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  FILE_SIZE_EXCEEDED = 'FILE_SIZE_EXCEEDED',
  FILE_TYPE_NOT_ALLOWED = 'FILE_TYPE_NOT_ALLOWED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_DELETE_FAILED = 'FILE_DELETE_FAILED',

  // UI errors
  UI_COMPONENT_ERROR = 'UI_COMPONENT_ERROR',
  UI_RENDER_FAILED = 'UI_RENDER_FAILED',
  UI_INTERACTION_FAILED = 'UI_INTERACTION_FAILED',

  // State errors
  STATE_INITIALIZATION_FAILED = 'STATE_INITIALIZATION_FAILED',
  STATE_UPDATE_FAILED = 'STATE_UPDATE_FAILED',
  STATE_SYNC_FAILED = 'STATE_SYNC_FAILED',

  // Data errors
  DATA_FETCH_FAILED = 'DATA_FETCH_FAILED',
  DATA_SAVE_FAILED = 'DATA_SAVE_FAILED',
  DATA_DELETE_FAILED = 'DATA_DELETE_FAILED',
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',

  // Network errors
  NETWORK_CONNECTION_FAILED = 'NETWORK_CONNECTION_FAILED',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_OFFLINE = 'NETWORK_OFFLINE',

  // WhatsApp errors
  WHATSAPP_API_ERROR = 'WHATSAPP_API_ERROR',
  WHATSAPP_TEMPLATE_ERROR = 'WHATSAPP_TEMPLATE_ERROR',
  WHATSAPP_MESSAGE_ERROR = 'WHATSAPP_MESSAGE_ERROR',
  WHATSAPP_MEDIA_ERROR = 'WHATSAPP_MEDIA_ERROR',
}

// Error helper functions
export function isRetryableError(error: WebError): boolean {
  return error.retryable;
}

export function isUserError(error: WebError): boolean {
  return error.statusCode >= 400 && error.statusCode < 500;
}

export function isServerError(error: WebError): boolean {
  return error.statusCode >= 500;
}

export function createErrorFromApiResponse(
  response: Response,
  data?: Record<string, unknown>
): WebError {
  const statusCode = response.status;
  const message = (data?.message as string) || `HTTP ${statusCode}: ${response.statusText}`;
  
  if (statusCode === 401) {
    return new AuthenticationError(message, { response: data });
  }
  
  if (statusCode === 403) {
    return new AuthorizationError(message, { response: data });
  }
  
  if (statusCode === 400) {
    const fieldErrors = (data?.fieldErrors as Record<string, string[]>) || {};
    return new ValidationError(message, fieldErrors, { response: data });
  }
  
  if (statusCode >= 500) {
    return new ApiError(message, statusCode, { response: data });
  }
  
  return new ApiError(message, statusCode, { response: data });
}

export function createErrorFromNetworkError(
  error: Error,
  context?: string
): WebError {
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
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Error boundary helper
export function getErrorBoundaryFallback(error: Error) {
  if (error instanceof WebError) {
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

  // In a real application, this would send to a logging service
  console.error('Web App Error:', errorInfo);
  
  return errorInfo;
}

// Error recovery helpers
export function canRecoverFromError(error: WebError): boolean {
  return error.retryable || isUserError(error);
}

export function getErrorRecoveryAction(error: WebError): string {
  if (error instanceof AuthenticationError) {
    return 'Please log in again';
  }
  
  if (error instanceof AuthorizationError) {
    return 'Contact your administrator for access';
  }
  
  if (error instanceof ValidationError) {
    return 'Please check your input and try again';
  }
  
  if (error instanceof NetworkError || error instanceof TimeoutError) {
    return 'Please check your connection and try again';
  }
  
  if (error instanceof FileError) {
    return 'Please check your file and try again';
  }
  
  return 'Please try again later';
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export function getErrorSeverity(error: WebError): ErrorSeverity {
  if (error instanceof ConfigError || error instanceof StateError) {
    return ErrorSeverity.CRITICAL;
  }
  
  if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
    return ErrorSeverity.HIGH;
  }
  
  if (error instanceof ApiError || error instanceof NetworkError) {
    return ErrorSeverity.MEDIUM;
  }
  
  if (error instanceof ValidationError || error instanceof FileError) {
    return ErrorSeverity.LOW;
  }
  
  return ErrorSeverity.MEDIUM;
}

// Error reporting
export function reportError(error: WebError, userContext?: Record<string, unknown>) {
  const errorReport = {
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      retryable: error.retryable,
      timestamp: error.timestamp.toISOString(),
    },
    context: {
      ...error.context,
      ...userContext,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    },
    severity: getErrorSeverity(error),
  };

  // In a real application, this would send to an error reporting service
  console.error('Error Report:', errorReport);
  
  return errorReport;
}
