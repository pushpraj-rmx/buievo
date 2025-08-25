import type { WorkerEvent, JobPayload, JobResult, WorkerStats } from './types';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerOptions {
  level: LogLevel;
  enableColors?: boolean;
  enableTimestamp?: boolean;
  enableContext?: boolean;
}

export interface LogContext {
  jobId?: string;
  contactId?: string;
  phoneNumber?: string;
  templateName?: string;
  operation?: string;
  duration?: number;
  retryCount?: number;
  [key: string]: unknown;
}

export class WappServiceLogger {
  private level: LogLevel;
  private enableColors: boolean;
  private enableTimestamp: boolean;
  private enableContext: boolean;

  constructor(options: LoggerOptions) {
    this.level = options.level;
    this.enableColors = options.enableColors ?? true;
    this.enableTimestamp = options.enableTimestamp ?? true;
    this.enableContext = options.enableContext ?? true;
  }

  private shouldLog(messageLevel: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[messageLevel] >= levels[this.level];
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const parts: string[] = [];

    if (this.enableTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    parts.push(`[${level.toUpperCase()}]`);

    if (this.enableContext && context) {
      const contextParts: string[] = [];
      if (context.jobId) contextParts.push(`job:${context.jobId}`);
      if (context.contactId) contextParts.push(`contact:${context.contactId}`);
      if (context.phoneNumber) contextParts.push(`phone:${context.phoneNumber}`);
      if (context.templateName) contextParts.push(`template:${context.templateName}`);
      if (context.operation) contextParts.push(`op:${context.operation}`);
      if (context.duration) contextParts.push(`duration:${context.duration}ms`);
      if (context.retryCount !== undefined) contextParts.push(`retry:${context.retryCount}`);
      
      if (contextParts.length > 0) {
        parts.push(`[${contextParts.join('|')}]`);
      }
    }

    parts.push(message);

    return parts.join(' ');
  }

  private colorize(level: LogLevel, text: string): string {
    if (!this.enableColors) return text;

    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      reset: '\x1b[0m',  // Reset
    };

    return `${colors[level]}${text}${colors.reset}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.colorize('debug', this.formatMessage('debug', message, context)));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.colorize('info', this.formatMessage('info', message, context)));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.colorize('warn', this.formatMessage('warn', message, context)));
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog('error')) {
      console.error(this.colorize('error', this.formatMessage('error', message, context)));
    }
  }

  // Specialized logging methods
  logWorkerStartup(config: Record<string, unknown>): void {
    this.info('🚀 WhatsApp Service Worker starting up', {
      operation: 'startup',
      config: Object.keys(config)
    });
  }

  logWorkerShutdown(reason: string): void {
    this.info('🛑 WhatsApp Service Worker shutting down', {
      operation: 'shutdown',
      reason
    });
  }

  logJobReceived(jobId: string, payload: JobPayload): void {
    this.info('📨 Job received from queue', {
      jobId,
      operation: 'job_received',
      templateName: payload.templateName,
      contactId: payload.contactId,
      phoneNumber: payload.phoneNumber,
      priority: payload.priority
    });
  }

  logJobStarted(jobId: string, payload: JobPayload): void {
    this.info('⚡ Job processing started', {
      jobId,
      operation: 'job_started',
      templateName: payload.templateName,
      contactId: payload.contactId,
      phoneNumber: payload.phoneNumber
    });
  }

  logJobCompleted(jobId: string, result: JobResult, duration: number): void {
    this.info('✅ Job completed successfully', {
      jobId,
      operation: 'job_completed',
      templateName: result.templateName,
      phoneNumber: result.phoneNumber,
      duration,
      messageId: result.messageId
    });
  }

  logJobFailed(jobId: string, error: string, retryable: boolean, retryCount?: number): void {
    this.error('❌ Job failed', {
      jobId,
      operation: 'job_failed',
      error,
      retryable,
      retryCount
    });
  }

  logJobRetrying(jobId: string, retryCount: number, delay: number): void {
    this.warn('🔄 Job retrying', {
      jobId,
      operation: 'job_retrying',
      retryCount,
      delay
    });
  }

  logContactLookup(contactId: string, phoneNumber: string): void {
    this.debug('👤 Contact lookup successful', {
      operation: 'contact_lookup',
      contactId,
      phoneNumber
    });
  }

  logWhatsAppApiCall(templateName: string, phoneNumber: string): void {
    this.debug('📱 Calling WhatsApp API', {
      operation: 'whatsapp_api_call',
      templateName,
      phoneNumber
    });
  }

  logWhatsAppApiSuccess(templateName: string, phoneNumber: string, messageId: string): void {
    this.info('📱 WhatsApp API call successful', {
      operation: 'whatsapp_api_success',
      templateName,
      phoneNumber,
      messageId
    });
  }

  logWhatsAppApiError(templateName: string, phoneNumber: string, error: string, retryable: boolean): void {
    this.error('📱 WhatsApp API call failed', {
      operation: 'whatsapp_api_error',
      templateName,
      phoneNumber,
      error,
      retryable
    });
  }

  logRedisConnection(status: 'connecting' | 'connected' | 'disconnected' | 'error', error?: string): void {
    const emoji = {
      connecting: '🔄',
      connected: '✅',
      disconnected: '❌',
      error: '💥'
    };

    if (status === 'error') {
      this.error(`${emoji[status]} Redis connection error: ${error}`, {
        operation: 'redis_connection',
        status
      });
    } else {
      this.info(`${emoji[status]} Redis ${status}`, {
        operation: 'redis_connection',
        status
      });
    }
  }

  logDatabaseConnection(status: 'connecting' | 'connected' | 'disconnected' | 'error', error?: string): void {
    const emoji = {
      connecting: '🔄',
      connected: '✅',
      disconnected: '❌',
      error: '💥'
    };

    if (status === 'error') {
      this.error(`${emoji[status]} Database connection error: ${error}`, {
        operation: 'database_connection',
        status
      });
    } else {
      this.info(`${emoji[status]} Database ${status}`, {
        operation: 'database_connection',
        status
      });
    }
  }

  logHealthCheck(result: Record<string, boolean>): void {
    const allHealthy = Object.values(result).every(Boolean);
    const emoji = allHealthy ? '✅' : '⚠️';
    
    this.info(`${emoji} Health check completed`, {
      operation: 'health_check',
      ...result
    });
  }

  logWorkerStats(stats: WorkerStats): void {
    this.info('📊 Worker statistics', {
      operation: 'worker_stats',
      totalJobs: stats.totalJobsProcessed,
      successfulJobs: stats.successfulJobs,
      failedJobs: stats.failedJobs,
      retriedJobs: stats.retriedJobs,
      averageProcessingTime: stats.averageProcessingTime,
      uptime: stats.uptime,
      isHealthy: stats.isHealthy
    });
  }

  logEvent(event: WorkerEvent): void {
    const emoji = {
      job_started: '⚡',
      job_completed: '✅',
      job_failed: '❌',
      job_retrying: '🔄',
      worker_started: '🚀',
      worker_stopped: '🛑',
      health_check: '💓'
    };

    this.debug(`${emoji[event.type]} Event: ${event.type}`, {
      operation: 'event',
      eventType: event.type,
      ...event.data
    });
  }

  logValidationError(jobId: string, errors: string[]): void {
    this.error('🔍 Job validation failed', {
      jobId,
      operation: 'validation_error',
      errors
    });
  }

  logRateLimit(phoneNumber: string, retryAfter: number): void {
    this.warn('⏰ Rate limit hit', {
      operation: 'rate_limit',
      phoneNumber,
      retryAfter
    });
  }

  logMemoryUsage(usage: number): void {
    this.debug('💾 Memory usage', {
      operation: 'memory_usage',
      usage: `${usage}MB`
    });
  }
}

// Default logger instance
export const logger = new WappServiceLogger({
  level: (process.env.WORKER_LOG_LEVEL as LogLevel) || 'info',
  enableColors: process.env.NODE_ENV !== 'production',
  enableTimestamp: true,
  enableContext: true,
});

// Factory function for creating loggers with custom options
export function createLogger(options: LoggerOptions): WappServiceLogger {
  return new WappServiceLogger(options);
}
