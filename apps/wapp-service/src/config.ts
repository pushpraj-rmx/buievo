import type { WorkerConfig, EnvironmentConfig } from './types';

// Default configuration values
export const DEFAULT_CONFIG: WorkerConfig = {
  queueChannel: 'message-queue',
  maxConcurrentJobs: 5,
  jobTimeout: 30000, // 30 seconds
  retryDelay: 5000, // 5 seconds
  maxRetries: 3,
  healthCheckInterval: 60000, // 1 minute
  gracefulShutdownTimeout: 10000, // 10 seconds
  logLevel: 'info',
};

// Default client options
export const DEFAULT_CLIENT_OPTIONS = {
  connectionTimeout: 10000,
  commandTimeout: 5000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Default health check configuration
export const DEFAULT_HEALTH_CHECK_CONFIG = {
  enabled: true,
  interval: 60000, // 1 minute
  timeout: 5000, // 5 seconds
  threshold: 3, // Number of consecutive failures before marking as unhealthy
};

// Load configuration from environment variables
export function loadConfigFromEnvironment(): WorkerConfig {
  return {
    queueChannel: process.env.WORKER_QUEUE_CHANNEL || DEFAULT_CONFIG.queueChannel,
    maxConcurrentJobs: process.env.WORKER_MAX_CONCURRENT_JOBS 
      ? parseInt(process.env.WORKER_MAX_CONCURRENT_JOBS) 
      : DEFAULT_CONFIG.maxConcurrentJobs,
    jobTimeout: process.env.WORKER_JOB_TIMEOUT 
      ? parseInt(process.env.WORKER_JOB_TIMEOUT) 
      : DEFAULT_CONFIG.jobTimeout,
    retryDelay: process.env.WORKER_RETRY_DELAY 
      ? parseInt(process.env.WORKER_RETRY_DELAY) 
      : DEFAULT_CONFIG.retryDelay,
    maxRetries: process.env.WORKER_MAX_RETRIES 
      ? parseInt(process.env.WORKER_MAX_RETRIES) 
      : DEFAULT_CONFIG.maxRetries,
    healthCheckInterval: process.env.WORKER_HEALTH_CHECK_INTERVAL 
      ? parseInt(process.env.WORKER_HEALTH_CHECK_INTERVAL) 
      : DEFAULT_CONFIG.healthCheckInterval,
    gracefulShutdownTimeout: process.env.WORKER_GRACEFUL_SHUTDOWN_TIMEOUT 
      ? parseInt(process.env.WORKER_GRACEFUL_SHUTDOWN_TIMEOUT) 
      : DEFAULT_CONFIG.gracefulShutdownTimeout,
    logLevel: (process.env.WORKER_LOG_LEVEL as WorkerConfig['logLevel']) || DEFAULT_CONFIG.logLevel,
  };
}

// Load client options from environment
export function loadClientOptionsFromEnvironment() {
  return {
    connectionTimeout: process.env.WORKER_CONNECTION_TIMEOUT 
      ? parseInt(process.env.WORKER_CONNECTION_TIMEOUT) 
      : DEFAULT_CLIENT_OPTIONS.connectionTimeout,
    commandTimeout: process.env.WORKER_COMMAND_TIMEOUT 
      ? parseInt(process.env.WORKER_COMMAND_TIMEOUT) 
      : DEFAULT_CLIENT_OPTIONS.commandTimeout,
    retryAttempts: process.env.WORKER_RETRY_ATTEMPTS 
      ? parseInt(process.env.WORKER_RETRY_ATTEMPTS) 
      : DEFAULT_CLIENT_OPTIONS.retryAttempts,
    retryDelay: process.env.WORKER_RETRY_DELAY 
      ? parseInt(process.env.WORKER_RETRY_DELAY) 
      : DEFAULT_CLIENT_OPTIONS.retryDelay,
  };
}

// Load health check configuration from environment
export function loadHealthCheckConfigFromEnvironment() {
  return {
    enabled: process.env.WORKER_HEALTH_CHECK_ENABLED !== 'false',
    interval: process.env.WORKER_HEALTH_CHECK_INTERVAL 
      ? parseInt(process.env.WORKER_HEALTH_CHECK_INTERVAL) 
      : DEFAULT_HEALTH_CHECK_CONFIG.interval,
    timeout: process.env.WORKER_HEALTH_CHECK_TIMEOUT 
      ? parseInt(process.env.WORKER_HEALTH_CHECK_TIMEOUT) 
      : DEFAULT_HEALTH_CHECK_CONFIG.timeout,
    threshold: process.env.WORKER_HEALTH_CHECK_THRESHOLD 
      ? parseInt(process.env.WORKER_HEALTH_CHECK_THRESHOLD) 
      : DEFAULT_HEALTH_CHECK_CONFIG.threshold,
  };
}

// Validate configuration
export function validateConfig(config: WorkerConfig): string[] {
  const errors: string[] = [];

  if (!config.queueChannel || config.queueChannel.trim() === '') {
    errors.push('Queue channel is required');
  }

  if (config.maxConcurrentJobs < 1 || config.maxConcurrentJobs > 100) {
    errors.push('Max concurrent jobs must be between 1 and 100');
  }

  if (config.jobTimeout < 1000 || config.jobTimeout > 300000) {
    errors.push('Job timeout must be between 1000ms and 300000ms (5 minutes)');
  }

  if (config.retryDelay < 1000 || config.retryDelay > 60000) {
    errors.push('Retry delay must be between 1000ms and 60000ms (1 minute)');
  }

  if (config.maxRetries < 0 || config.maxRetries > 10) {
    errors.push('Max retries must be between 0 and 10');
  }

  if (config.healthCheckInterval < 10000 || config.healthCheckInterval > 300000) {
    errors.push('Health check interval must be between 10000ms and 300000ms (5 minutes)');
  }

  if (config.gracefulShutdownTimeout < 1000 || config.gracefulShutdownTimeout > 60000) {
    errors.push('Graceful shutdown timeout must be between 1000ms and 60000ms (1 minute)');
  }

  const validLogLevels: WorkerConfig['logLevel'][] = ['debug', 'info', 'warn', 'error'];
  if (!validLogLevels.includes(config.logLevel)) {
    errors.push(`Log level must be one of: ${validLogLevels.join(', ')}`);
  }

  return errors;
}

// Validate client options
export function validateClientOptions(options: Record<string, number>): string[] {
  const errors: string[] = [];

  if (options.connectionTimeout < 1000 || options.connectionTimeout > 60000) {
    errors.push('Connection timeout must be between 1000ms and 60000ms (1 minute)');
  }

  if (options.commandTimeout < 1000 || options.commandTimeout > 30000) {
    errors.push('Command timeout must be between 1000ms and 30000ms (30 seconds)');
  }

  if (options.retryAttempts < 0 || options.retryAttempts > 10) {
    errors.push('Retry attempts must be between 0 and 10');
  }

  if (options.retryDelay < 100 || options.retryDelay > 10000) {
    errors.push('Retry delay must be between 100ms and 10000ms (10 seconds)');
  }

  return errors;
}

// Validate health check configuration
export function validateHealthCheckConfig(config: Record<string, unknown>): string[] {
  const errors: string[] = [];

  if (typeof config.enabled !== 'boolean') {
    errors.push('Health check enabled must be a boolean');
  }

  if (config.interval && (typeof config.interval !== 'number' || config.interval < 5000 || config.interval > 300000)) {
    errors.push('Health check interval must be between 5000ms and 300000ms (5 minutes)');
  }

  if (config.timeout && (typeof config.timeout !== 'number' || config.timeout < 1000 || config.timeout > 30000)) {
    errors.push('Health check timeout must be between 1000ms and 30000ms (30 seconds)');
  }

  if (config.threshold && (typeof config.threshold !== 'number' || config.threshold < 1 || config.threshold > 10)) {
    errors.push('Health check threshold must be between 1 and 10');
  }

  return errors;
}

// Create configuration with validation
export function createConfig(): WorkerConfig {
  const config = loadConfigFromEnvironment();
  const errors = validateConfig(config);

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }

  return config;
}

// Create client options with validation
export function createClientOptions() {
  const options = loadClientOptionsFromEnvironment();
  const errors = validateClientOptions(options);

  if (errors.length > 0) {
    throw new Error(`Client options validation failed:\n${errors.join('\n')}`);
  }

  return options;
}

// Create health check configuration with validation
export function createHealthCheckConfig() {
  const config = loadHealthCheckConfigFromEnvironment();
  const errors = validateHealthCheckConfig(config);

  if (errors.length > 0) {
    throw new Error(`Health check configuration validation failed:\n${errors.join('\n')}`);
  }

  return config;
}

// Get all configuration
export function getWorkerConfig() {
  return {
    worker: createConfig(),
    client: createClientOptions(),
    healthCheck: createHealthCheckConfig(),
  };
}

// Environment validation
export function validateEnvironment(): string[] {
  const errors: string[] = [];
  const requiredEnvVars = [
    'REDIS_URL',
    'DATABASE_URL',
    'PHONE_NUMBER_ID',
    'ACCESS_TOKEN',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Validate URLs
  if (process.env.REDIS_URL) {
    try {
      new URL(process.env.REDIS_URL);
    } catch {
      errors.push('Invalid REDIS_URL format');
    }
  }

  if (process.env.DATABASE_URL) {
    try {
      new URL(process.env.DATABASE_URL);
    } catch {
      errors.push('Invalid DATABASE_URL format');
    }
  }

  return errors;
}

// Get environment configuration
export function getEnvironmentConfig(): EnvironmentConfig {
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    REDIS_URL: process.env.REDIS_URL || '',
    DATABASE_URL: process.env.DATABASE_URL || '',
    PHONE_NUMBER_ID: process.env.PHONE_NUMBER_ID || '',
    ACCESS_TOKEN: process.env.ACCESS_TOKEN || '',
    WORKER_MAX_CONCURRENT_JOBS: process.env.WORKER_MAX_CONCURRENT_JOBS,
    WORKER_JOB_TIMEOUT: process.env.WORKER_JOB_TIMEOUT,
    WORKER_RETRY_DELAY: process.env.WORKER_RETRY_DELAY,
    WORKER_MAX_RETRIES: process.env.WORKER_MAX_RETRIES,
    WORKER_HEALTH_CHECK_INTERVAL: process.env.WORKER_HEALTH_CHECK_INTERVAL,
    WORKER_LOG_LEVEL: process.env.WORKER_LOG_LEVEL,
  };
}
