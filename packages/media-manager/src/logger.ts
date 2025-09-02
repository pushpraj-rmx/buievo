// Logging for Media Manager
// Structured logging with configurable levels and formatting

export interface LogLevel {
  DEBUG: 0;
  INFO: 1;
  WARN: 2;
  ERROR: 3;
}

export const LOG_LEVELS: LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

export interface LoggerOptions {
  level?: keyof LogLevel;
  enableConsole?: boolean;
  enableFile?: boolean;
  logFile?: string;
  includeTimestamp?: boolean;
  includeRequestId?: boolean;
}

export interface LogContext {
  mediaId?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  operation?: string;
  requestId?: string;
  userId?: string;
  duration?: number;
  statusCode?: number;
  errorCode?: string;
  storageProvider?: string;
  [key: string]: unknown;
}

/**
 * Media Manager Logger
 */
export class MediaLogger {
  private level: number;
  private enableConsole: boolean;
  private enableFile: boolean;
  private logFile?: string;
  private includeTimestamp: boolean;
  private includeRequestId: boolean;

  constructor(options: LoggerOptions = {}) {
    this.level = LOG_LEVELS[options.level || 'INFO'];
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile || false;
    this.logFile = options.logFile;
    this.includeTimestamp = options.includeTimestamp !== false;
    this.includeRequestId = options.includeRequestId !== false;
  }

  /**
   * Check if message should be logged based on level
   */
  private shouldLog(messageLevel: number): boolean {
    return messageLevel >= this.level;
  }

  /**
   * Format log message
   */
  private formatMessage(
    level: string,
    message: string,
    context?: LogContext
  ): string {
    const parts: string[] = [];

    if (this.includeTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    parts.push(`[${level}]`);

    if (this.includeRequestId && context?.requestId) {
      parts.push(`[${context.requestId}]`);
    }

    parts.push(message);

    if (context && Object.keys(context).length > 0) {
      const contextStr = JSON.stringify(context, null, 2);
      parts.push(`\nContext: ${contextStr}`);
    }

    return parts.join(' ');
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      const formattedMessage = this.formatMessage('DEBUG', message, context);

      if (this.enableConsole) {
        console.debug(formattedMessage);
      }

      if (this.enableFile && this.logFile) {
        // In a real implementation, you'd write to file here
        // For now, we'll just use console
        console.debug(`[FILE] ${formattedMessage}`);
      }
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      const formattedMessage = this.formatMessage('INFO', message, context);

      if (this.enableConsole) {
        console.info(formattedMessage);
      }

      if (this.enableFile && this.logFile) {
        console.info(`[FILE] ${formattedMessage}`);
      }
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      const formattedMessage = this.formatMessage('WARN', message, context);

      if (this.enableConsole) {
        console.warn(formattedMessage);
      }

      if (this.enableFile && this.logFile) {
        console.warn(`[FILE] ${formattedMessage}`);
      }
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      const errorContext = {
        ...context,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : undefined,
      };

      const formattedMessage = this.formatMessage('ERROR', message, errorContext);

      if (this.enableConsole) {
        console.error(formattedMessage);
      }

      if (this.enableFile && this.logFile) {
        console.error(`[FILE] ${formattedMessage}`);
      }
    }
  }

  /**
   * Log media upload operation
   */
  logMediaUpload(
    fileName: string,
    mimeType: string,
    fileSize: number,
    status: 'started' | 'completed' | 'failed',
    context?: LogContext
  ): void {
    const message = `Media upload ${status}: ${fileName} (${mimeType}, ${fileSize} bytes)`;
    const logContext: LogContext = {
      ...context,
      fileName,
      mimeType,
      fileSize,
      operation: 'upload',
      status,
    };

    switch (status) {
      case 'started':
        this.info(message, logContext);
        break;
      case 'completed':
        this.info(message, logContext);
        break;
      case 'failed':
        this.error(message, undefined, logContext);
        break;
    }
  }

  /**
   * Log media download operation
   */
  logMediaDownload(
    mediaId: string,
    status: 'started' | 'completed' | 'failed',
    context?: LogContext
  ): void {
    const message = `Media download ${status}: ${mediaId}`;
    const logContext: LogContext = {
      ...context,
      mediaId,
      operation: 'download',
      status,
    };

    switch (status) {
      case 'started':
        this.info(message, logContext);
        break;
      case 'completed':
        this.info(message, logContext);
        break;
      case 'failed':
        this.error(message, undefined, logContext);
        break;
    }
  }

  /**
   * Log media delete operation
   */
  logMediaDelete(
    mediaId: string,
    status: 'started' | 'completed' | 'failed',
    context?: LogContext
  ): void {
    const message = `Media delete ${status}: ${mediaId}`;
    const logContext: LogContext = {
      ...context,
      mediaId,
      operation: 'delete',
      status,
    };

    switch (status) {
      case 'started':
        this.info(message, logContext);
        break;
      case 'completed':
        this.info(message, logContext);
        break;
      case 'failed':
        this.error(message, undefined, logContext);
        break;
    }
  }

  /**
   * Log file validation result
   */
  logFileValidation(
    fileName: string,
    mimeType: string,
    fileSize: number,
    isValid: boolean,
    errors: string[],
    warnings: string[],
    context?: LogContext
  ): void {
    const message = `File validation ${isValid ? 'passed' : 'failed'}: ${fileName}`;
    const logContext: LogContext = {
      ...context,
      fileName,
      mimeType,
      fileSize,
      isValid,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };

    if (isValid) {
      this.info(message, logContext);
    } else {
      this.error(message, undefined, logContext);
    }
  }

  /**
   * Log storage provider operation
   */
  logStorageOperation(
    provider: string,
    operation: string,
    status: 'started' | 'completed' | 'failed',
    context?: LogContext
  ): void {
    const message = `Storage ${operation} ${status}: ${provider}`;
    const logContext: LogContext = {
      ...context,
      storageProvider: provider,
      operation,
      status,
    };

    switch (status) {
      case 'started':
        this.info(message, logContext);
        break;
      case 'completed':
        this.info(message, logContext);
        break;
      case 'failed':
        this.error(message, undefined, logContext);
        break;
    }
  }

  /**
   * Log API request
   */
  logApiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const message = `API ${method} ${url} - ${statusCode} (${duration}ms)`;
    const logContext: LogContext = {
      ...context,
      method,
      url,
      statusCode,
      duration,
    };

    if (statusCode >= 400) {
      this.error(message, undefined, logContext);
    } else if (statusCode >= 300) {
      this.warn(message, logContext);
    } else {
      this.info(message, logContext);
    }
  }

  /**
   * Log rate limit event
   */
  logRateLimit(
    endpoint: string,
    retryAfter: number,
    context?: LogContext
  ): void {
    const message = `Rate limit hit for ${endpoint}, retry after ${retryAfter}s`;
    const logContext: LogContext = {
      ...context,
      endpoint,
      retryAfter,
    };

    this.warn(message, logContext);
  }

  /**
   * Log file size check
   */
  logFileSizeCheck(
    fileName: string,
    fileSize: number,
    maxSize: number,
    isWithinLimit: boolean,
    context?: LogContext
  ): void {
    const message = `File size check ${isWithinLimit ? 'passed' : 'failed'}: ${fileName} (${fileSize}/${maxSize} bytes)`;
    const logContext: LogContext = {
      ...context,
      fileName,
      fileSize,
      maxSize,
      isWithinLimit,
    };

    if (isWithinLimit) {
      this.debug(message, logContext);
    } else {
      this.warn(message, logContext);
    }
  }

  /**
   * Log file type check
   */
  logFileTypeCheck(
    fileName: string,
    mimeType: string,
    allowedTypes: string[],
    isAllowed: boolean,
    context?: LogContext
  ): void {
    const message = `File type check ${isAllowed ? 'passed' : 'failed'}: ${fileName} (${mimeType})`;
    const logContext: LogContext = {
      ...context,
      fileName,
      mimeType,
      allowedTypes,
      isAllowed,
    };

    if (isAllowed) {
      this.debug(message, logContext);
    } else {
      this.warn(message, logContext);
    }
  }
}

/**
 * Create default logger instance
 */
export function createLogger(options: LoggerOptions = {}): MediaLogger {
  return new MediaLogger({
    level: (process.env.MEDIA_MANAGER_LOG_LEVEL as keyof LogLevel) || 'INFO',
    enableConsole: true,
    includeTimestamp: true,
    includeRequestId: true,
    ...options,
  });
}

/**
 * Default logger instance
 */
export const logger = createLogger();
