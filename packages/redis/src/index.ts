// Redis Module Package
// Main entry point for Redis client with comprehensive error handling and logging

// Export new modular components
export { createLogger, RedisLogger } from './logger.js';
export type {
  LogLevel,
  LoggerOptions,
  LogContext
} from './logger.js';

export {
  RedisModuleError,
  RedisConfigError,
  RedisConnectionError,
  RedisAuthError,
  RedisTimeoutError,
  RedisCommandError,
  RedisKeyNotFoundError,
  RedisKeyExistsError,
  RedisMemoryError,
  RedisNetworkError,
  RedisSerializationError,
  RedisDeserializationError,
  createErrorFromRedisError,
  createConnectionError,
  isRetryableError,
  ERROR_CODES,
} from './errors.js';
export type {
  RedisErrorDetails,
  ConnectionErrorDetails,
  ErrorCode
} from './errors.js';

export {
  createConfig,
  createClientOptions,
  createHealthCheckConfig,
  loadConfigFromEnvironment,
  loadClientOptionsFromEnvironment,
  loadHealthCheckConfigFromEnvironment,
  parseRedisUrl,
  validateConfig,
  validateClientOptions,
  validateHealthCheckConfig,
  getRedisClientConfig,
  DEFAULT_CONFIG,
  DEFAULT_CLIENT_OPTIONS,
  DEFAULT_HEALTH_CHECK_CONFIG,
} from './config.js';
export type {
  RedisConfig,
  RedisClientOptions,
  RedisHealthCheckConfig
} from './config.js';

// Export types
export type {
  RedisKeyValue,
  RedisHashField,
  RedisListItem,
  RedisSetMember,
  RedisSortedSetMember,
  RedisTransaction,
  RedisPipeline,
  RedisMetrics,
  RedisHealthStatus,
  RedisConnectionInfo,
  RedisKeyInfo,
  RedisMemoryInfo,
  RedisInfo,
  RedisPubSubMessage,
  RedisPubSubSubscription,
  RedisScript,
  RedisScriptResult,
  RedisScanResult,
  RedisScanOptions,
  RedisKeyPattern,
  RedisKeyExpiration,
  RedisKeyStatistics,
  RedisPerformanceMetrics,
  RedisSlowLogEntry,
  RedisLatencyHistory,
  RedisLatencySpike,
  RedisConfigValue,
  RedisConfigSection,
  RedisClientConfig,
  RedisPoolConfig,
  RedisPoolMetrics,
  RedisPoolStatus,
  RedisClusterNode,
  RedisClusterInfo,
  RedisSentinelMaster,
  RedisSentinelSlave,
  RedisSentinelInfo,
} from './types.js';

// Legacy imports for backward compatibility
import { createClient, RedisClientType } from "redis";
import { logger } from './logger.js';
import { createConfig, getRedisClientConfig } from './config.js';
import {
  RedisModuleError,
  RedisConnectionError,
  createConnectionError,
  createErrorFromRedisError,
  isRetryableError,
} from './errors.js';
import type { RedisConfig } from './config.js';

/**
 * Enhanced Redis Client with comprehensive error handling and logging
 */
export class EnhancedRedisClient {
  private client: RedisClientType;
  private config: RedisConfig;
  private connected: boolean = false;
  private lastError?: Error;
  private metrics = {
    totalCommands: 0,
    successfulCommands: 0,
    failedCommands: 0,
    averageResponseTime: 0,
    slowQueries: 0,
    connections: 0,
    memoryUsage: 0,
    lastCommandTime: new Date(),
    uptime: 0,
  };

  constructor(config?: Partial<RedisConfig>) {
    this.config = createConfig(config);
    const clientConfig = getRedisClientConfig(this.config);
    
    logger.logConnection('connecting', { connectionUrl: this.config.url });
    
    this.client = createClient(clientConfig);
    this.setupEventHandlers();
  }

  /**
   * Setup Redis client event handlers
   */
  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      this.connected = true;
      this.lastError = undefined;
      logger.logConnection('connected', { connectionUrl: this.config.url });
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready', { connectionUrl: this.config.url });
    });

    this.client.on('error', (error) => {
      this.connected = false;
      this.lastError = error;
      this.metrics.failedCommands++;
      
      const redisError = createConnectionError(error, this.config.url);
      logger.logConnection('error', { 
        connectionUrl: this.config.url,
        error: error.message 
      });
    });

    this.client.on('end', () => {
      this.connected = false;
      logger.logConnection('disconnected', { connectionUrl: this.config.url });
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting', { connectionUrl: this.config.url });
    });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      const redisError = createConnectionError(error as Error, this.config.url);
      throw redisError;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
    } catch (error) {
      const redisError = createConnectionError(error as Error, this.config.url);
      throw redisError;
    }
  }

  /**
   * Execute a Redis command with error handling and logging
   */
  private async executeCommand<T>(
    command: string,
    key: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    this.metrics.totalCommands++;

    try {
      logger.logCommand(command, key, 'started');
      
      const result = await operation();
      
      const duration = Date.now() - startTime;
      this.metrics.successfulCommands++;
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * (this.metrics.successfulCommands - 1) + duration) / 
        this.metrics.successfulCommands;
      this.metrics.lastCommandTime = new Date();

      if (duration > 100) {
        this.metrics.slowQueries++;
        logger.logPerformance(command, duration, key);
      }

      logger.logCommand(command, key, 'completed', duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.failedCommands++;
      this.metrics.lastCommandTime = new Date();

      const redisError = createErrorFromRedisError(error as Error, command, key);
      logger.logCommand(command, key, 'failed', duration, { error: (error as Error).message });
      
      throw redisError;
    }
  }

  /**
   * Get a value from Redis
   */
  async get(key: string): Promise<string | null> {
    return this.executeCommand('GET', key, () => this.client.get(key));
  }

  /**
   * Set a value in Redis
   */
  async set(key: string, value: string, ttl?: number): Promise<'OK'> {
    if (ttl) {
      const result = await this.executeCommand('SET', key, () => this.client.setEx(key, ttl, value));
      return result as 'OK';
    }
    const result = await this.executeCommand('SET', key, () => this.client.set(key, value));
    return result as 'OK';
  }

  /**
   * Delete a key from Redis
   */
  async del(key: string): Promise<number> {
    return this.executeCommand('DEL', key, () => this.client.del(key));
  }

  /**
   * Check if a key exists in Redis
   */
  async exists(key: string): Promise<number> {
    return this.executeCommand('EXISTS', key, () => this.client.exists(key));
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, seconds: number): Promise<number> {
    return this.executeCommand('EXPIRE', key, () => this.client.expire(key, seconds));
  }

  /**
   * Get time to live for a key
   */
  async ttl(key: string): Promise<number> {
    return this.executeCommand('TTL', key, () => this.client.ttl(key));
  }

  /**
   * Get Redis client instance
   */
  getClient(): RedisClientType {
    return this.client;
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get last error
   */
  getLastError(): Error | undefined {
    return this.lastError;
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get configuration
   */
  getConfig(): RedisConfig {
    return { ...this.config };
  }
}

// Legacy Redis client for backward compatibility
let legacyRedisClient: RedisClientType | null = null;

/**
 * Get or create the legacy Redis client
 */
export function getRedisClient(): RedisClientType {
  if (!legacyRedisClient) {
    const config = createConfig();
    const clientConfig = getRedisClientConfig(config);
    
    logger.info('Creating legacy Redis client', { connectionUrl: config.url });
    
    legacyRedisClient = createClient(clientConfig);
    
    legacyRedisClient.on("error", (err) => {
      logger.error("❌ Redis client error", err);
    });
  }
  
  return legacyRedisClient;
}

/**
 * Create a new Redis client with enhanced features
 */
export function createRedisClient(config?: Partial<RedisConfig>): EnhancedRedisClient {
  return new EnhancedRedisClient(config);
}

// Legacy export for backward compatibility
export const redis = getRedisClient();

// Export the raw createClient function for advanced usage
export { createClient } from 'redis';
export type { RedisClientType } from 'redis';
