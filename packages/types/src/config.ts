// Configuration types for buievo

// Environment configuration
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  HOST: string;
  BASE_URL: string;
  API_VERSION: string;
}

// Database configuration
export interface DatabaseConfig {
  DATABASE_URL: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_SSL: boolean;
  DB_POOL_MIN: number;
  DB_POOL_MAX: number;
  DB_TIMEOUT: number;
}

// Redis configuration
export interface RedisConfig {
  REDIS_URL: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  REDIS_DB: number;
  REDIS_TTL: number;
  REDIS_PREFIX: string;
}

// JWT configuration
export interface JwtConfig {
  JWT_SECRET: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
}

// WhatsApp configuration
export interface WhatsAppConfig {
  WHATSAPP_ACCESS_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_BUSINESS_ACCOUNT_ID: string;
  WHATSAPP_APP_ID: string;
  WHATSAPP_APP_SECRET: string;
  WHATSAPP_VERIFY_TOKEN: string;
  WHATSAPP_WEBHOOK_URL: string;
  WHATSAPP_API_VERSION: string;
  WHATSAPP_RATE_LIMIT: number;
  WHATSAPP_RATE_LIMIT_WINDOW: number;
}

// Email configuration
export interface EmailConfig {
  EMAIL_PROVIDER: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
  EMAIL_HOST?: string;
  EMAIL_PORT?: number;
  EMAIL_USER?: string;
  EMAIL_PASSWORD?: string;
  EMAIL_FROM: string;
  EMAIL_FROM_NAME: string;
  SENDGRID_API_KEY?: string;
  MAILGUN_API_KEY?: string;
  MAILGUN_DOMAIN?: string;
  SES_ACCESS_KEY_ID?: string;
  SES_SECRET_ACCESS_KEY?: string;
  SES_REGION?: string;
}

// Storage configuration
export interface StorageConfig {
  STORAGE_PROVIDER: 'local' | 's3' | 'gcs' | 'azure';
  STORAGE_BUCKET?: string;
  STORAGE_REGION?: string;
  STORAGE_ACCESS_KEY_ID?: string;
  STORAGE_SECRET_ACCESS_KEY?: string;
  STORAGE_ENDPOINT?: string;
  STORAGE_PATH: string;
  STORAGE_MAX_FILE_SIZE: number;
  STORAGE_ALLOWED_TYPES: string[];
}

// Logging configuration
export interface LoggingConfig {
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  LOG_FORMAT: 'json' | 'text';
  LOG_FILE?: string;
  LOG_MAX_SIZE: number;
  LOG_MAX_FILES: number;
  LOG_COLORIZE: boolean;
  LOG_TIMESTAMP: boolean;
}

// Security configuration
export interface SecurityConfig {
  CORS_ORIGIN: string | string[];
  CORS_CREDENTIALS: boolean;
  CORS_MAX_AGE: number;
  RATE_LIMIT_WINDOW: number;
  RATE_LIMIT_MAX: number;
  SESSION_SECRET: string;
  SESSION_MAX_AGE: number;
  PASSWORD_MIN_LENGTH: number;
  PASSWORD_REQUIRE_UPPERCASE: boolean;
  PASSWORD_REQUIRE_LOWERCASE: boolean;
  PASSWORD_REQUIRE_NUMBERS: boolean;
  PASSWORD_REQUIRE_SYMBOLS: boolean;
}

// Monitoring configuration
export interface MonitoringConfig {
  ENABLE_METRICS: boolean;
  METRICS_PORT: number;
  ENABLE_HEALTH_CHECKS: boolean;
  HEALTH_CHECK_INTERVAL: number;
  ENABLE_TRACING: boolean;
  TRACING_SERVICE_NAME: string;
  TRACING_ENDPOINT?: string;
}

// Feature flags configuration
export interface FeatureFlagsConfig {
  ENABLE_TEMPLATES: boolean;
  ENABLE_CAMPAIGNS: boolean;
  ENABLE_MEDIA_UPLOAD: boolean;
  ENABLE_WEBHOOKS: boolean;
  ENABLE_ANALYTICS: boolean;
  ENABLE_NOTIFICATIONS: boolean;
  ENABLE_MULTI_TENANCY: boolean;
  ENABLE_SSO: boolean;
}

// Admin configuration
export interface AdminConfig {
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  ADMIN_ROLE: 'admin';
  ENABLE_ADMIN_PANEL: boolean;
  ADMIN_SESSION_TIMEOUT: number;
}

// Worker configuration
export interface WorkerConfig {
  ENABLE_WORKERS: boolean;
  WORKER_CONCURRENCY: number;
  WORKER_TIMEOUT: number;
  WORKER_RETRY_ATTEMPTS: number;
  WORKER_RETRY_DELAY: number;
  QUEUE_NAME: string;
  QUEUE_PREFIX: string;
}

// Notification configuration
export interface NotificationConfig {
  ENABLE_EMAIL_NOTIFICATIONS: boolean;
  ENABLE_PUSH_NOTIFICATIONS: boolean;
  ENABLE_SMS_NOTIFICATIONS: boolean;
  NOTIFICATION_TEMPLATES_PATH: string;
  DEFAULT_NOTIFICATION_CHANNEL: 'email' | 'push' | 'sms';
}

// Analytics configuration
export interface AnalyticsConfig {
  ENABLE_ANALYTICS: boolean;
  ANALYTICS_PROVIDER: 'internal' | 'google' | 'mixpanel' | 'amplitude';
  ANALYTICS_TRACKING_ID?: string;
  ANALYTICS_API_KEY?: string;
  ANALYTICS_ENDPOINT?: string;
  ANALYTICS_BATCH_SIZE: number;
  ANALYTICS_FLUSH_INTERVAL: number;
}

// Cache configuration
export interface CacheConfig {
  ENABLE_CACHE: boolean;
  CACHE_TTL: number;
  CACHE_PREFIX: string;
  CACHE_MAX_KEYS: number;
  CACHE_CLEANUP_INTERVAL: number;
}

// Webhook configuration
export interface WebhookConfig {
  ENABLE_WEBHOOKS: boolean;
  WEBHOOK_SECRET: string;
  WEBHOOK_TIMEOUT: number;
  WEBHOOK_RETRY_ATTEMPTS: number;
  WEBHOOK_RETRY_DELAY: number;
  WEBHOOK_MAX_PAYLOAD_SIZE: number;
}

// Complete application configuration
export interface AppConfig {
  environment: EnvironmentConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  jwt: JwtConfig;
  whatsapp: WhatsAppConfig;
  email: EmailConfig;
  storage: StorageConfig;
  logging: LoggingConfig;
  security: SecurityConfig;
  monitoring: MonitoringConfig;
  features: FeatureFlagsConfig;
  admin: AdminConfig;
  worker: WorkerConfig;
  notifications: NotificationConfig;
  analytics: AnalyticsConfig;
  cache: CacheConfig;
  webhooks: WebhookConfig;
}

// Configuration validation result
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
  invalid: string[];
}

// Configuration loader interface
export interface ConfigLoader {
  load(): AppConfig;
  validate(): ConfigValidationResult;
  get(key: string): any;
  set(key: string, value: any): void;
  has(key: string): boolean;
  reload(): void;
}

// Environment variable types
export type EnvironmentVariable = keyof AppConfig;

// Configuration change event
export interface ConfigChangeEvent {
  key: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
}

// Configuration watcher interface
export interface ConfigWatcher {
  watch(key: string, callback: (event: ConfigChangeEvent) => void): void;
  unwatch(key: string): void;
  unwatchAll(): void;
}

// Configuration provider interface
export interface ConfigProvider {
  get<T = any>(key: string, defaultValue?: T): T;
  set<T = any>(key: string, value: T): void;
  delete(key: string): boolean;
  clear(): void;
  keys(): string[];
  values(): any[];
  entries(): [string, any][];
}

// Configuration schema for validation
export interface ConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required: boolean;
    default?: any;
    validator?: (value: any) => boolean;
    transformer?: (value: any) => any;
  };
}
