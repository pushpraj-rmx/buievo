// Configuration for Redis Module
// Centralized configuration management and validation

export interface RedisConfig {
  url: string;
  host?: string;
  port?: number;
  password?: string;
  database?: number;
  username?: string;
  retryDelayOnFailover?: number;
  enableReadyCheck?: boolean;
  maxRetriesPerRequest?: number;
  connectTimeout?: number;
  commandTimeout?: number;
  lazyConnect?: boolean;
  keepAlive?: number;
  family?: number;
  noDelay?: boolean;
  connectionName?: string;
  readOnly?: boolean;
  maxLoadingTimeout?: number;
  enableOfflineQueue?: boolean;
  enableAutoPipelining?: boolean;
  autoPipeliningIgnoredCommands?: string[];
  disableClientInfo?: boolean;
  socket?: {
    keepAlive?: number;
    family?: number;
    noDelay?: boolean;
  };
  tls?: {
    ca?: string;
    cert?: string;
    key?: string;
    passphrase?: string;
    rejectUnauthorized?: boolean;
  };
}

export interface RedisClientOptions {
  enableLogging?: boolean;
  enableMetrics?: boolean;
  enableHealthCheck?: boolean;
  healthCheckInterval?: number;
  maxConnections?: number;
  connectionPool?: {
    min?: number;
    max?: number;
    acquireTimeoutMillis?: number;
    createTimeoutMillis?: number;
    destroyTimeoutMillis?: number;
    idleTimeoutMillis?: number;
    reapIntervalMillis?: number;
    createRetryIntervalMillis?: number;
  };
}

export interface RedisHealthCheckConfig {
  enabled: boolean;
  interval: number;
  timeout: number;
  maxFailures: number;
  commands: string[];
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: RedisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  host: 'localhost',
  port: 6379,
  database: 0,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  connectTimeout: 10000,
  commandTimeout: 5000,
  lazyConnect: false,
  keepAlive: 0,
  family: 4,
  noDelay: true,
  enableOfflineQueue: true,
  enableAutoPipelining: false,
  autoPipeliningIgnoredCommands: ['AUTH', 'SELECT'],
  disableClientInfo: false,
  socket: {
    keepAlive: 0,
    family: 4,
    noDelay: true,
  },
};

export const DEFAULT_CLIENT_OPTIONS: RedisClientOptions = {
  enableLogging: true,
  enableMetrics: true,
  enableHealthCheck: true,
  healthCheckInterval: 30000, // 30 seconds
  maxConnections: 10,
  connectionPool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },
};

export const DEFAULT_HEALTH_CHECK_CONFIG: RedisHealthCheckConfig = {
  enabled: true,
  interval: 30000, // 30 seconds
  timeout: 5000, // 5 seconds
  maxFailures: 3,
  commands: ['PING', 'INFO'],
};

/**
 * Load configuration from environment variables
 */
export function loadConfigFromEnvironment(): Partial<RedisConfig> {
  return {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
    password: process.env.REDIS_PASSWORD,
    database: process.env.REDIS_DATABASE ? parseInt(process.env.REDIS_DATABASE) : undefined,
    username: process.env.REDIS_USERNAME,
    retryDelayOnFailover: process.env.REDIS_RETRY_DELAY ? parseInt(process.env.REDIS_RETRY_DELAY) : undefined,
    enableReadyCheck: process.env.REDIS_ENABLE_READY_CHECK !== 'false',
    maxRetriesPerRequest: process.env.REDIS_MAX_RETRIES ? parseInt(process.env.REDIS_MAX_RETRIES) : undefined,
    connectTimeout: process.env.REDIS_CONNECT_TIMEOUT ? parseInt(process.env.REDIS_CONNECT_TIMEOUT) : undefined,
    commandTimeout: process.env.REDIS_COMMAND_TIMEOUT ? parseInt(process.env.REDIS_COMMAND_TIMEOUT) : undefined,
    lazyConnect: process.env.REDIS_LAZY_CONNECT === 'true',
    keepAlive: process.env.REDIS_KEEP_ALIVE ? parseInt(process.env.REDIS_KEEP_ALIVE) : undefined,
    family: process.env.REDIS_FAMILY ? parseInt(process.env.REDIS_FAMILY) : undefined,
    noDelay: process.env.REDIS_NO_DELAY !== 'false',
    connectionName: process.env.REDIS_CONNECTION_NAME,
    readOnly: process.env.REDIS_READ_ONLY === 'true',
    maxLoadingTimeout: process.env.REDIS_MAX_LOADING_TIMEOUT ? parseInt(process.env.REDIS_MAX_LOADING_TIMEOUT) : undefined,
    enableOfflineQueue: process.env.REDIS_ENABLE_OFFLINE_QUEUE !== 'false',
    enableAutoPipelining: process.env.REDIS_ENABLE_AUTO_PIPELINING === 'true',
    disableClientInfo: process.env.REDIS_DISABLE_CLIENT_INFO === 'true',
  };
}

/**
 * Load client options from environment variables
 */
export function loadClientOptionsFromEnvironment(): Partial<RedisClientOptions> {
  return {
    enableLogging: process.env.REDIS_ENABLE_LOGGING !== 'false',
    enableMetrics: process.env.REDIS_ENABLE_METRICS !== 'false',
    enableHealthCheck: process.env.REDIS_ENABLE_HEALTH_CHECK !== 'false',
    healthCheckInterval: process.env.REDIS_HEALTH_CHECK_INTERVAL ? parseInt(process.env.REDIS_HEALTH_CHECK_INTERVAL) : undefined,
    maxConnections: process.env.REDIS_MAX_CONNECTIONS ? parseInt(process.env.REDIS_MAX_CONNECTIONS) : undefined,
  };
}

/**
 * Load health check configuration from environment variables
 */
export function loadHealthCheckConfigFromEnvironment(): Partial<RedisHealthCheckConfig> {
  return {
    enabled: process.env.REDIS_HEALTH_CHECK_ENABLED !== 'false',
    interval: process.env.REDIS_HEALTH_CHECK_INTERVAL ? parseInt(process.env.REDIS_HEALTH_CHECK_INTERVAL) : undefined,
    timeout: process.env.REDIS_HEALTH_CHECK_TIMEOUT ? parseInt(process.env.REDIS_HEALTH_CHECK_TIMEOUT) : undefined,
    maxFailures: process.env.REDIS_HEALTH_CHECK_MAX_FAILURES ? parseInt(process.env.REDIS_HEALTH_CHECK_MAX_FAILURES) : undefined,
    commands: process.env.REDIS_HEALTH_CHECK_COMMANDS ? process.env.REDIS_HEALTH_CHECK_COMMANDS.split(',') : undefined,
  };
}

/**
 * Parse Redis URL to extract configuration
 */
export function parseRedisUrl(url: string): Partial<RedisConfig> {
  try {
    const parsed = new URL(url);
    const config: Partial<RedisConfig> = {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port) : 6379,
      database: parsed.pathname ? parseInt(parsed.pathname.slice(1)) : 0,
    };

    if (parsed.username) {
      config.username = parsed.username;
    }

    if (parsed.password) {
      config.password = parsed.password;
    }

    return config;
  } catch (error) {
    throw new Error(`Invalid Redis URL: ${url}`);
  }
}

/**
 * Validate Redis configuration
 */
export function validateConfig(config: RedisConfig): string[] {
  const errors: string[] = [];

  if (!config.url && !config.host) {
    errors.push('Redis URL or host is required');
  }

  if (config.port && (config.port < 1 || config.port > 65535)) {
    errors.push('Redis port must be between 1 and 65535');
  }

  if (config.database && (config.database < 0 || config.database > 15)) {
    errors.push('Redis database must be between 0 and 15');
  }

  if (config.connectTimeout && config.connectTimeout <= 0) {
    errors.push('Connect timeout must be greater than 0');
  }

  if (config.commandTimeout && config.commandTimeout <= 0) {
    errors.push('Command timeout must be greater than 0');
  }

  if (config.maxRetriesPerRequest && config.maxRetriesPerRequest < 0) {
    errors.push('Max retries per request must be non-negative');
  }

  if (config.retryDelayOnFailover && config.retryDelayOnFailover < 0) {
    errors.push('Retry delay on failover must be non-negative');
  }

  if (config.keepAlive && config.keepAlive < 0) {
    errors.push('Keep alive must be non-negative');
  }

  if (config.family && ![4, 6].includes(config.family)) {
    errors.push('Family must be 4 (IPv4) or 6 (IPv6)');
  }

  return errors;
}

/**
 * Validate client options
 */
export function validateClientOptions(options: RedisClientOptions): string[] {
  const errors: string[] = [];

  if (options.healthCheckInterval && options.healthCheckInterval <= 0) {
    errors.push('Health check interval must be greater than 0');
  }

  if (options.maxConnections && options.maxConnections <= 0) {
    errors.push('Max connections must be greater than 0');
  }

  if (options.connectionPool) {
    const pool = options.connectionPool;
    
    if (pool.min && pool.min < 0) {
      errors.push('Connection pool min must be non-negative');
    }

    if (pool.max && pool.max <= 0) {
      errors.push('Connection pool max must be greater than 0');
    }

    if (pool.min && pool.max && pool.min > pool.max) {
      errors.push('Connection pool min cannot be greater than max');
    }

    if (pool.acquireTimeoutMillis && pool.acquireTimeoutMillis <= 0) {
      errors.push('Connection pool acquire timeout must be greater than 0');
    }

    if (pool.createTimeoutMillis && pool.createTimeoutMillis <= 0) {
      errors.push('Connection pool create timeout must be greater than 0');
    }

    if (pool.destroyTimeoutMillis && pool.destroyTimeoutMillis <= 0) {
      errors.push('Connection pool destroy timeout must be greater than 0');
    }

    if (pool.idleTimeoutMillis && pool.idleTimeoutMillis <= 0) {
      errors.push('Connection pool idle timeout must be greater than 0');
    }

    if (pool.reapIntervalMillis && pool.reapIntervalMillis <= 0) {
      errors.push('Connection pool reap interval must be greater than 0');
    }

    if (pool.createRetryIntervalMillis && pool.createRetryIntervalMillis <= 0) {
      errors.push('Connection pool create retry interval must be greater than 0');
    }
  }

  return errors;
}

/**
 * Validate health check configuration
 */
export function validateHealthCheckConfig(config: RedisHealthCheckConfig): string[] {
  const errors: string[] = [];

  if (config.interval <= 0) {
    errors.push('Health check interval must be greater than 0');
  }

  if (config.timeout <= 0) {
    errors.push('Health check timeout must be greater than 0');
  }

  if (config.maxFailures <= 0) {
    errors.push('Health check max failures must be greater than 0');
  }

  if (!config.commands || config.commands.length === 0) {
    errors.push('Health check commands cannot be empty');
  }

  return errors;
}

/**
 * Create configuration by merging defaults, environment, and options
 */
export function createConfig(options: Partial<RedisConfig> = {}): RedisConfig {
  const envConfig = loadConfigFromEnvironment();
  
  // Parse URL if provided
  const urlConfig = options.url || envConfig.url ? parseRedisUrl(options.url || envConfig.url!) : {};

  const config: RedisConfig = {
    ...DEFAULT_CONFIG,
    ...urlConfig,
    ...envConfig,
    ...options,
  };

  const errors = validateConfig(config);
  if (errors.length > 0) {
    throw new Error(`Redis configuration validation failed: ${errors.join(', ')}`);
  }

  return config;
}

/**
 * Create client options by merging defaults, environment, and options
 */
export function createClientOptions(options: Partial<RedisClientOptions> = {}): RedisClientOptions {
  const envOptions = loadClientOptionsFromEnvironment();

  const clientOptions: RedisClientOptions = {
    ...DEFAULT_CLIENT_OPTIONS,
    ...envOptions,
    ...options,
  };

  const errors = validateClientOptions(clientOptions);
  if (errors.length > 0) {
    throw new Error(`Redis client options validation failed: ${errors.join(', ')}`);
  }

  return clientOptions;
}

/**
 * Create health check configuration by merging defaults, environment, and options
 */
export function createHealthCheckConfig(options: Partial<RedisHealthCheckConfig> = {}): RedisHealthCheckConfig {
  const envConfig = loadHealthCheckConfigFromEnvironment();

  const healthCheckConfig: RedisHealthCheckConfig = {
    ...DEFAULT_HEALTH_CHECK_CONFIG,
    ...envConfig,
    ...options,
  };

  const errors = validateHealthCheckConfig(healthCheckConfig);
  if (errors.length > 0) {
    throw new Error(`Redis health check configuration validation failed: ${errors.join(', ')}`);
  }

  return healthCheckConfig;
}

/**
 * Get Redis client configuration for redis.createClient()
 */
export function getRedisClientConfig(config: RedisConfig): Record<string, unknown> {
  const clientConfig: Record<string, unknown> = {
    url: config.url,
  };

  if (config.host) clientConfig.host = config.host;
  if (config.port) clientConfig.port = config.port;
  if (config.password) clientConfig.password = config.password;
  if (config.database) clientConfig.database = config.database;
  if (config.username) clientConfig.username = config.username;
  if (config.retryDelayOnFailover) clientConfig.retryDelayOnFailover = config.retryDelayOnFailover;
  if (config.enableReadyCheck !== undefined) clientConfig.enableReadyCheck = config.enableReadyCheck;
  if (config.maxRetriesPerRequest) clientConfig.maxRetriesPerRequest = config.maxRetriesPerRequest;
  if (config.connectTimeout) clientConfig.connectTimeout = config.connectTimeout;
  if (config.commandTimeout) clientConfig.commandTimeout = config.commandTimeout;
  if (config.lazyConnect !== undefined) clientConfig.lazyConnect = config.lazyConnect;
  if (config.keepAlive) clientConfig.keepAlive = config.keepAlive;
  if (config.family) clientConfig.family = config.family;
  if (config.noDelay !== undefined) clientConfig.noDelay = config.noDelay;
  if (config.connectionName) clientConfig.connectionName = config.connectionName;
  if (config.readOnly !== undefined) clientConfig.readOnly = config.readOnly;
  if (config.maxLoadingTimeout) clientConfig.maxLoadingTimeout = config.maxLoadingTimeout;
  if (config.enableOfflineQueue !== undefined) clientConfig.enableOfflineQueue = config.enableOfflineQueue;
  if (config.enableAutoPipelining !== undefined) clientConfig.enableAutoPipelining = config.enableAutoPipelining;
  if (config.autoPipeliningIgnoredCommands) clientConfig.autoPipeliningIgnoredCommands = config.autoPipeliningIgnoredCommands;
  if (config.disableClientInfo !== undefined) clientConfig.disableClientInfo = config.disableClientInfo;
  if (config.socket) clientConfig.socket = config.socket;
  if (config.tls) clientConfig.tls = config.tls;

  return clientConfig;
}
