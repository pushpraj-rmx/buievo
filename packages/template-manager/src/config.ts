// Configuration Management for Template Manager
// Centralized configuration handling and validation

export interface TemplateManagerConfig {
  baseUrl: string;
  accessToken: string;
  businessId: string;
  phoneNumberId: string;
  apiVersion: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  enableLogging: boolean;
  enableCaching: boolean;
  cacheTtl: number;
  rateLimit: {
    requestsPerMinute: number;
    burstLimit: number;
  };
}

export interface TemplateValidationConfig {
  maxTemplateNameLength: number;
  maxHeaderLength: number;
  maxFooterLength: number;
  maxButtonTextLength: number;
  maxUrlLength: number;
  maxPhoneNumberLength: number;
  maxCarouselCards: number;
  maxButtonsPerTemplate: number;
  maxButtonsPerCard: number;
  allowedTemplateCategories: string[];
  allowedButtonTypes: string[];
  allowedComponentTypes: string[];
  allowedHeaderFormats: string[];
}

export interface MediaConfig {
  maxFileSize: number;
  allowedImageTypes: string[];
  allowedVideoTypes: string[];
  allowedDocumentTypes: string[];
  maxImageSize: number;
  maxVideoSize: number;
  maxDocumentSize: number;
}

export interface ConfigOptions {
  baseUrl?: string;
  accessToken?: string;
  businessId?: string;
  phoneNumberId?: string;
  apiVersion?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  enableLogging?: boolean;
  enableCaching?: boolean;
  cacheTtl?: number;
  rateLimit?: {
    requestsPerMinute?: number;
    burstLimit?: number;
  };
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: TemplateManagerConfig = {
  baseUrl: 'https://graph.facebook.com',
  accessToken: '',
  businessId: '',
  phoneNumberId: '',
  apiVersion: 'v21.0',
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  enableLogging: true,
  enableCaching: true,
  cacheTtl: 300, // 5 minutes
  rateLimit: {
    requestsPerMinute: 60,
    burstLimit: 10,
  },
};

const DEFAULT_VALIDATION_CONFIG: TemplateValidationConfig = {
  maxTemplateNameLength: 512,
  maxHeaderLength: 60,
  maxFooterLength: 60,
  maxButtonTextLength: 25,
  maxUrlLength: 2000,
  maxPhoneNumberLength: 20,
  maxCarouselCards: 10,
  maxButtonsPerTemplate: 3,
  maxButtonsPerCard: 2,
  allowedTemplateCategories: ['MARKETING', 'UTILITY', 'AUTHENTICATION'],
  allowedButtonTypes: ['QUICK_REPLY', 'URL', 'PHONE_NUMBER', 'COPY_CODE'],
  allowedComponentTypes: ['HEADER', 'BODY', 'FOOTER', 'BUTTONS', 'CAROUSEL'],
  allowedHeaderFormats: ['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'],
};

const DEFAULT_MEDIA_CONFIG: MediaConfig = {
  maxFileSize: 16 * 1024 * 1024, // 16MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedVideoTypes: ['video/mp4', 'video/3gpp'],
  allowedDocumentTypes: ['application/pdf', 'text/plain'],
  maxImageSize: 5 * 1024 * 1024, // 5MB
  maxVideoSize: 16 * 1024 * 1024, // 16MB
  maxDocumentSize: 100 * 1024 * 1024, // 100MB
};

/**
 * Load configuration from environment variables
 */
function loadFromEnvironment(): Partial<TemplateManagerConfig> {
  return {
    baseUrl: process.env.META_API_BASE_URL || process.env.FACEBOOK_API_BASE_URL,
    accessToken: process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN,
    businessId: process.env.WHATSAPP_BUSINESS_ID || process.env.WABA_ID,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID,
    apiVersion: process.env.META_API_VERSION || 'v21.0',
    timeout: process.env.TEMPLATE_MANAGER_TIMEOUT ? parseInt(process.env.TEMPLATE_MANAGER_TIMEOUT) : undefined,
    retries: process.env.TEMPLATE_MANAGER_RETRIES ? parseInt(process.env.TEMPLATE_MANAGER_RETRIES) : undefined,
    retryDelay: process.env.TEMPLATE_MANAGER_RETRY_DELAY ? parseInt(process.env.TEMPLATE_MANAGER_RETRY_DELAY) : undefined,
    enableLogging: process.env.TEMPLATE_MANAGER_LOGGING !== 'false',
    enableCaching: process.env.TEMPLATE_MANAGER_CACHING !== 'false',
    cacheTtl: process.env.TEMPLATE_MANAGER_CACHE_TTL ? parseInt(process.env.TEMPLATE_MANAGER_CACHE_TTL) : undefined,
    rateLimit: {
      requestsPerMinute: process.env.TEMPLATE_MANAGER_RATE_LIMIT ? parseInt(process.env.TEMPLATE_MANAGER_RATE_LIMIT) : DEFAULT_CONFIG.rateLimit.requestsPerMinute,
      burstLimit: process.env.TEMPLATE_MANAGER_BURST_LIMIT ? parseInt(process.env.TEMPLATE_MANAGER_BURST_LIMIT) : DEFAULT_CONFIG.rateLimit.burstLimit,
    },
  };
}

/**
 * Validate configuration
 */
function validateConfig(config: TemplateManagerConfig): void {
  const errors: string[] = [];

  if (!config.accessToken) {
    errors.push('Access token is required');
  }

  if (!config.businessId) {
    errors.push('Business ID is required');
  }

  if (!config.phoneNumberId) {
    errors.push('Phone number ID is required');
  }

  if (!config.baseUrl) {
    errors.push('Base URL is required');
  }

  if (config.timeout <= 0) {
    errors.push('Timeout must be greater than 0');
  }

  if (config.retries < 0) {
    errors.push('Retries must be non-negative');
  }

  if (config.retryDelay < 0) {
    errors.push('Retry delay must be non-negative');
  }

  if (config.cacheTtl <= 0) {
    errors.push('Cache TTL must be greater than 0');
  }

  if (config.rateLimit.requestsPerMinute <= 0) {
    errors.push('Rate limit requests per minute must be greater than 0');
  }

  if (config.rateLimit.burstLimit <= 0) {
    errors.push('Rate limit burst limit must be greater than 0');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
  }
}

/**
 * Create configuration by merging defaults, environment, and options
 */
export function createConfig(options: ConfigOptions = {}): TemplateManagerConfig {
  const envConfig = loadFromEnvironment();
  
  const config: TemplateManagerConfig = {
    ...DEFAULT_CONFIG,
    ...envConfig,
    ...options,
    rateLimit: {
      ...DEFAULT_CONFIG.rateLimit,
      ...envConfig.rateLimit,
      ...options.rateLimit,
    },
  };

  validateConfig(config);
  return config;
}

/**
 * Get validation configuration
 */
export function getValidationConfig(): TemplateValidationConfig {
  return { ...DEFAULT_VALIDATION_CONFIG };
}

/**
 * Get media configuration
 */
export function getMediaConfig(): MediaConfig {
  return { ...DEFAULT_MEDIA_CONFIG };
}

/**
 * Create API URL for templates
 */
export function createTemplateApiUrl(config: TemplateManagerConfig, endpoint: string = ''): string {
  const baseUrl = config.baseUrl.replace(/\/$/, '');
  const apiVersion = config.apiVersion.replace(/^v/, '');
  const phoneNumberId = config.phoneNumberId;
  
  return `${baseUrl}/v${apiVersion}/${phoneNumberId}/message_templates${endpoint}`;
}

/**
 * Create API URL for media
 */
export function createMediaApiUrl(config: TemplateManagerConfig, endpoint: string = ''): string {
  const baseUrl = config.baseUrl.replace(/\/$/, '');
  const apiVersion = config.apiVersion.replace(/^v/, '');
  
  return `${baseUrl}/v${apiVersion}/me/media${endpoint}`;
}

/**
 * Get headers for API requests
 */
export function getApiHeaders(config: TemplateManagerConfig, additionalHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    'Authorization': `Bearer ${config.accessToken}`,
    'Content-Type': 'application/json',
    'User-Agent': 'WhatsSuite-TemplateManager/1.0.0',
    ...additionalHeaders,
  };
}
