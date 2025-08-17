// Simple logging utility for the API
export interface LogData {
  [key: string]: any;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private context: string;
  private requestId?: string;

  constructor(context: string, requestId?: string) {
    this.context = context;
    this.requestId = requestId;
  }

  private formatMessage(level: LogLevel, message: string, data?: LogData): string {
    const timestamp = new Date().toISOString();
    const requestIdStr = this.requestId ? `[${this.requestId}]` : '';
    const contextStr = this.context ? `[${this.context}]` : '';
    
    return `[${timestamp}] [${level.toUpperCase()}] ${requestIdStr} ${contextStr} ${message}`;
  }

  debug(message: string, data?: LogData): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this.formatMessage('debug', message), data || '');
    }
  }

  info(message: string, data?: LogData): void {
    console.log(this.formatMessage('info', message), data || '');
  }

  warn(message: string, data?: LogData): void {
    console.warn(this.formatMessage('warn', message), data || '');
  }

  error(message: string, data?: LogData): void {
    console.error(this.formatMessage('error', message), data || '');
  }

  // Create a new logger instance with the same context but different request ID
  withRequestId(requestId: string): Logger {
    return new Logger(this.context, requestId);
  }

  // Create a new logger instance with a different context
  withContext(context: string): Logger {
    return new Logger(context, this.requestId);
  }
}

// Global logger instances
export const apiLogger = new Logger('API');
export const webhookLogger = new Logger('WEBHOOK');
export const dbLogger = new Logger('DATABASE');

// Utility function to generate request IDs
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Utility function to create a logger for a specific request
export const createRequestLogger = (requestId: string, context: string = 'REQUEST'): Logger => {
  return new Logger(context, requestId);
};
