// Logging for Redis Module
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
  operation?: string;
  key?: string;
  command?: string;
  connectionUrl?: string;
  database?: number;
  retryAttempt?: number;
  maxRetries?: number;
  duration?: number;
  errorCode?: string;
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Redis Module Logger
 */
export class RedisLogger {
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
   * Log Redis connection event
   */
  logConnection(
    status: 'connecting' | 'connected' | 'disconnected' | 'error',
    context?: LogContext
  ): void {
    const message = `Redis connection ${status}`;
    const logContext: LogContext = {
      ...context,
      status,
    };

    switch (status) {
      case 'connecting':
        this.info(message, logContext);
        break;
      case 'connected':
        this.info(message, logContext);
        break;
      case 'disconnected':
        this.warn(message, logContext);
        break;
      case 'error':
        this.error(message, undefined, logContext);
        break;
    }
  }

  /**
   * Log Redis command execution
   */
  logCommand(
    command: string,
    key: string,
    status: 'started' | 'completed' | 'failed',
    duration?: number,
    context?: LogContext
  ): void {
    const message = `Redis ${command} ${status}: ${key}`;
    const logContext: LogContext = {
      ...context,
      command,
      key,
      status,
      duration,
    };

    switch (status) {
      case 'started':
        this.debug(message, logContext);
        break;
      case 'completed':
        this.debug(message, logContext);
        break;
      case 'failed':
        this.error(message, undefined, logContext);
        break;
    }
  }

  /**
   * Log Redis key operation
   */
  logKeyOperation(
    operation: 'get' | 'set' | 'del' | 'exists' | 'expire' | 'ttl',
    key: string,
    status: 'started' | 'completed' | 'failed',
    context?: LogContext
  ): void {
    const message = `Redis key ${operation} ${status}: ${key}`;
    const logContext: LogContext = {
      ...context,
      operation,
      key,
      status,
    };

    switch (status) {
      case 'started':
        this.debug(message, logContext);
        break;
      case 'completed':
        this.debug(message, logContext);
        break;
      case 'failed':
        this.error(message, undefined, logContext);
        break;
    }
  }

  /**
   * Log Redis hash operation
   */
  logHashOperation(
    operation: 'hget' | 'hset' | 'hdel' | 'hgetall' | 'hexists',
    key: string,
    status: 'started' | 'completed' | 'failed',
    field?: string,
    context?: LogContext
  ): void {
    const message = `Redis hash ${operation} ${status}: ${key}${field ? `:${field}` : ''}`;
    const logContext: LogContext = {
      ...context,
      operation,
      key,
      field,
      status,
    };

    switch (status) {
      case 'started':
        this.debug(message, logContext);
        break;
      case 'completed':
        this.debug(message, logContext);
        break;
      case 'failed':
        this.error(message, undefined, logContext);
        break;
    }
  }

  /**
   * Log Redis list operation
   */
  logListOperation(
    operation: 'lpush' | 'rpush' | 'lpop' | 'rpop' | 'lrange' | 'llen',
    key: string,
    status: 'started' | 'completed' | 'failed',
    context?: LogContext
  ): void {
    const message = `Redis list ${operation} ${status}: ${key}`;
    const logContext: LogContext = {
      ...context,
      operation,
      key,
      status,
    };

    switch (status) {
      case 'started':
        this.debug(message, logContext);
        break;
      case 'completed':
        this.debug(message, logContext);
        break;
      case 'failed':
        this.error(message, undefined, logContext);
        break;
    }
  }

  /**
   * Log Redis set operation
   */
  logSetOperation(
    operation: 'sadd' | 'srem' | 'smembers' | 'sismember' | 'scard',
    key: string,
    status: 'started' | 'completed' | 'failed',
    context?: LogContext
  ): void {
    const message = `Redis set ${operation} ${status}: ${key}`;
    const logContext: LogContext = {
      ...context,
      operation,
      key,
      status,
    };

    switch (status) {
      case 'started':
        this.debug(message, logContext);
        break;
      case 'completed':
        this.debug(message, logContext);
        break;
      case 'failed':
        this.error(message, undefined, logContext);
        break;
    }
  }

  /**
   * Log Redis sorted set operation
   */
  logSortedSetOperation(
    operation: 'zadd' | 'zrem' | 'zrange' | 'zscore' | 'zcard',
    key: string,
    status: 'started' | 'completed' | 'failed',
    context?: LogContext
  ): void {
    const message = `Redis sorted set ${operation} ${status}: ${key}`;
    const logContext: LogContext = {
      ...context,
      operation,
      key,
      status,
    };

    switch (status) {
      case 'started':
        this.debug(message, logContext);
        break;
      case 'completed':
        this.debug(message, logContext);
        break;
      case 'failed':
        this.error(message, undefined, logContext);
        break;
    }
  }

  /**
   * Log Redis transaction
   */
  logTransaction(
    status: 'started' | 'completed' | 'failed' | 'discarded',
    context?: LogContext
  ): void {
    const message = `Redis transaction ${status}`;
    const logContext: LogContext = {
      ...context,
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
      case 'discarded':
        this.warn(message, logContext);
        break;
    }
  }

  /**
   * Log Redis pipeline
   */
  logPipeline(
    commandCount: number,
    status: 'started' | 'completed' | 'failed',
    context?: LogContext
  ): void {
    const message = `Redis pipeline ${status}: ${commandCount} commands`;
    const logContext: LogContext = {
      ...context,
      commandCount,
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
   * Log Redis retry attempt
   */
  logRetry(
    operation: string,
    attempt: number,
    maxRetries: number,
    context?: LogContext
  ): void {
    const message = `Redis retry attempt ${attempt}/${maxRetries} for ${operation}`;
    const logContext: LogContext = {
      ...context,
      operation,
      retryAttempt: attempt,
      maxRetries,
    };

    this.warn(message, logContext);
  }

  /**
   * Log Redis performance metrics
   */
  logPerformance(
    operation: string,
    duration: number,
    key?: string,
    context?: LogContext
  ): void {
    const message = `Redis ${operation} completed in ${duration}ms${key ? ` for key: ${key}` : ''}`;
    const logContext: LogContext = {
      ...context,
      operation,
      duration,
      key,
    };

    if (duration > 100) {
      this.warn(message, logContext);
    } else {
      this.debug(message, logContext);
    }
  }

  /**
   * Log Redis memory usage
   */
  logMemoryUsage(
    usedMemory: number,
    maxMemory: number,
    context?: LogContext
  ): void {
    const percentage = (usedMemory / maxMemory) * 100;
    const message = `Redis memory usage: ${percentage.toFixed(1)}% (${usedMemory}/${maxMemory} bytes)`;
    const logContext: LogContext = {
      ...context,
      usedMemory,
      maxMemory,
      percentage,
    };

    if (percentage > 80) {
      this.error(message, undefined, logContext);
    } else if (percentage > 60) {
      this.warn(message, logContext);
    } else {
      this.debug(message, logContext);
    }
  }
}

/**
 * Create default logger instance
 */
export function createLogger(options: LoggerOptions = {}): RedisLogger {
  return new RedisLogger({
    level: (process.env.REDIS_LOG_LEVEL as keyof LogLevel) || 'INFO',
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
