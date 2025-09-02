// Logging for Template Manager
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
  templateName?: string;
  operation?: string;
  requestId?: string;
  userId?: string;
  duration?: number;
  statusCode?: number;
  errorCode?: string;
  [key: string]: unknown;
}

/**
 * Template Manager Logger
 */
export class TemplateLogger {
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
   * Log template operation
   */
  logTemplateOperation(
    operation: string,
    templateName: string,
    status: 'started' | 'completed' | 'failed',
    context?: LogContext
  ): void {
    const message = `Template ${operation} ${status}: ${templateName}`;
    const logContext: LogContext = {
      ...context,
      templateName,
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
   * Log validation result
   */
  logValidationResult(
    templateName: string,
    isValid: boolean,
    errors: string[],
    warnings: string[],
    context?: LogContext
  ): void {
    const message = `Template validation ${isValid ? 'passed' : 'failed'}: ${templateName}`;
    const logContext: LogContext = {
      ...context,
      templateName,
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
   * Log media operation
   */
  logMediaOperation(
    operation: string,
    mediaId: string,
    mediaType: string,
    status: 'started' | 'completed' | 'failed',
    context?: LogContext
  ): void {
    const message = `Media ${operation} ${status}: ${mediaId} (${mediaType})`;
    const logContext: LogContext = {
      ...context,
      mediaId,
      mediaType,
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
   * Log cache operation
   */
  logCacheOperation(
    operation: 'get' | 'set' | 'delete',
    key: string,
    hit: boolean,
    context?: LogContext
  ): void {
    const message = `Cache ${operation} ${hit ? 'hit' : 'miss'}: ${key}`;
    const logContext: LogContext = {
      ...context,
      cacheOperation: operation,
      cacheKey: key,
      cacheHit: hit,
    };

    this.debug(message, logContext);
  }
}

/**
 * Create default logger instance
 */
export function createLogger(options: LoggerOptions = {}): TemplateLogger {
  return new TemplateLogger({
    level: (process.env.TEMPLATE_MANAGER_LOG_LEVEL as keyof LogLevel) || 'INFO',
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
