// WhatsApp Client Logger
// Centralized logging for WhatsApp Business API client

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
}

export class WhatsAppLogger {
  private level: number;
  private enableConsole: boolean;
  private enableFile: boolean;
  private logFile?: string;

  constructor(options: LoggerOptions = {}) {
    this.level = LOG_LEVELS[options.level || 'INFO'];
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile || false;
    this.logFile = options.logFile;
  }

  private shouldLog(messageLevel: number): boolean {
    return messageLevel >= this.level;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${level}] ${message}`;
    
    if (data) {
      return `${baseMessage}\n${JSON.stringify(data, null, 2)}`;
    }
    
    return baseMessage;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      const formattedMessage = this.formatMessage('DEBUG', message, data);
      
      if (this.enableConsole) {
        console.debug(formattedMessage);
      }
      
      if (this.enableFile && this.logFile) {
        // TODO: Implement file logging
        console.debug(`[FILE LOG] ${formattedMessage}`);
      }
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      const formattedMessage = this.formatMessage('INFO', message, data);
      
      if (this.enableConsole) {
        console.info(formattedMessage);
      }
      
      if (this.enableFile && this.logFile) {
        // TODO: Implement file logging
        console.info(`[FILE LOG] ${formattedMessage}`);
      }
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      const formattedMessage = this.formatMessage('WARN', message, data);
      
      if (this.enableConsole) {
        console.warn(formattedMessage);
      }
      
      if (this.enableFile && this.logFile) {
        // TODO: Implement file logging
        console.warn(`[FILE LOG] ${formattedMessage}`);
      }
    }
  }

  error(message: string, error?: any): void {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      const formattedMessage = this.formatMessage('ERROR', message, error);
      
      if (this.enableConsole) {
        console.error(formattedMessage);
      }
      
      if (this.enableFile && this.logFile) {
        // TODO: Implement file logging
        console.error(`[FILE LOG] ${formattedMessage}`);
      }
    }
  }

  // Specialized logging methods for WhatsApp operations
  logConfiguration(config: any): void {
    this.info('WhatsApp Configuration', {
      apiVersion: config.apiVersion,
      phoneNumberId: config.phoneNumberId ? `${config.phoneNumberId.substring(0, 4)}...` : 'NOT SET',
      accessToken: config.accessToken ? `${config.accessToken.substring(0, 10)}...` : 'NOT SET',
      baseUrl: config.baseUrl,
      timeout: config.timeout,
      retries: config.retries,
      retryDelay: config.retryDelay,
    });
  }

  logRequest(method: string, url: string, payload?: any): void {
    this.debug('WhatsApp API Request', {
      method,
      url,
      payload,
    });
  }

  logResponse(status: number, data?: any): void {
    this.info('WhatsApp API Response', {
      status,
      data,
    });
  }

  logError(status: number, error: any, payload?: any): void {
    this.error('WhatsApp API Error', {
      status,
      error: error.response?.data?.error || error.message,
      payload,
      headers: error.response?.headers,
    });
  }
}

// Default logger instance
export const logger = new WhatsAppLogger({
  level: (process.env.LOG_LEVEL as keyof LogLevel) || 'INFO',
  enableConsole: true,
});
