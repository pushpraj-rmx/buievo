// HTTP Client for Template Manager
// Axios-based client with retry logic, rate limiting, and error handling

import axios, { AxiosInstance, AxiosRequestConfig, isAxiosError } from 'axios';
import { TemplateManagerConfig, createTemplateApiUrl, createMediaApiUrl, getApiHeaders } from './config.js';
import { logger } from './logger.js';
import {
  TemplateRateLimitError,
  createErrorFromApiResponse,
  createErrorFromNetworkError,
  isRetryableError
} from './errors.js';

export interface HttpClientOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  enableLogging?: boolean;
}

export interface RateLimitInfo {
  requestsPerMinute: number;
  burstLimit: number;
  currentRequests: number;
  resetTime: number;
}

/**
 * HTTP Client for Template Manager
 */
export class TemplateHttpClient {
  private axiosInstance: AxiosInstance;
  private config: TemplateManagerConfig;
  private retries: number;
  private retryDelay: number;
  private enableLogging: boolean;
  private rateLimitInfo: RateLimitInfo;

  constructor(config: TemplateManagerConfig, options: HttpClientOptions = {}) {
    this.config = config;
    this.retries = options.retries || config.retries;
    this.retryDelay = options.retryDelay || config.retryDelay;
    this.enableLogging = options.enableLogging !== false;

    this.rateLimitInfo = {
      requestsPerMinute: config.rateLimit.requestsPerMinute,
      burstLimit: config.rateLimit.burstLimit,
      currentRequests: 0,
      resetTime: Date.now() + 60000, // 1 minute from now
    };

    this.axiosInstance = axios.create({
      timeout: options.timeout || config.timeout,
      headers: getApiHeaders(config),
    });

    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for logging and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.enableLogging) {
          logger.debug('API Request', {
            method: config.method?.toUpperCase(),
            url: config.url,
            headers: config.headers,
          });
        }
        return config;
      },
      (error) => {
        if (this.enableLogging) {
          logger.error('Request interceptor error', error);
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        if (this.enableLogging) {
          const metadata = (response.config as unknown as Record<string, unknown>).metadata as Record<string, unknown>;
          logger.logApiRequest(
            response.config.method?.toUpperCase() || 'UNKNOWN',
            response.config.url || '',
            response.status,
            Date.now() - ((metadata?.startTime as number) || Date.now()),
            { requestId: metadata?.requestId as string }
          );
        }
        return response;
      },
      (error) => {
        if (this.enableLogging && isAxiosError(error)) {
          const metadata = (error.config as unknown as Record<string, unknown>)?.metadata as Record<string, unknown>;
          const duration = Date.now() - ((metadata?.startTime as number) || Date.now());
          logger.logApiRequest(
            error.config?.method?.toUpperCase() || 'UNKNOWN',
            error.config?.url || '',
            error.response?.status || 0,
            duration,
            { requestId: metadata?.requestId as string }
          );
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check rate limit before making request
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();

    // Reset counter if minute has passed
    if (now > this.rateLimitInfo.resetTime) {
      this.rateLimitInfo.currentRequests = 0;
      this.rateLimitInfo.resetTime = now + 60000;
    }

    // Check if we're at the limit
    if (this.rateLimitInfo.currentRequests >= this.rateLimitInfo.requestsPerMinute) {
      const waitTime = this.rateLimitInfo.resetTime - now;
      logger.logRateLimit('template-api', waitTime / 1000);
      throw new TemplateRateLimitError(`Rate limit exceeded. Retry after ${Math.ceil(waitTime / 1000)} seconds.`, waitTime / 1000);
    }

    // Increment request counter
    this.rateLimitInfo.currentRequests++;
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(config: AxiosRequestConfig): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        // Check rate limit before each attempt
        await this.checkRateLimit();

        // Add metadata for logging
        const requestConfig: AxiosRequestConfig = {
          ...config,
        };
        (requestConfig as Record<string, unknown>).metadata = {
          startTime: Date.now(),
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          attempt: attempt + 1,
        };

        const response = await this.axiosInstance.request<T>(requestConfig);
        return response.data;
      } catch (error) {
        lastError = error as Error;

        // Handle rate limit errors
        if (error instanceof TemplateRateLimitError) {
          const retryAfter = ((error as unknown as { details?: { apiResponse?: { retryAfter?: number } } }).details?.apiResponse?.retryAfter) || 60;
          logger.warn(`Rate limit hit, waiting ${retryAfter} seconds before retry`);
          await this.delay(retryAfter * 1000);
          continue;
        }

        // Handle axios errors
        if (isAxiosError(error)) {
          const statusCode = error.response?.status || 0;
          const errorData = error.response?.data;

          // Create appropriate error
          const templateError = createErrorFromApiResponse(statusCode, errorData as Record<string, unknown>);

          // If not retryable or max retries reached, throw
          if (!templateError.retryable || attempt >= this.retries) {
            throw templateError;
          }

          // Log retry attempt
          logger.warn(`Request failed (attempt ${attempt + 1}/${this.retries + 1}), retrying...`, {
            statusCode,
            error: templateError.message,
            attempt: attempt + 1,
            retries: this.retries,
          });

          // Wait before retry with exponential backoff
          await this.delay(this.retryDelay * Math.pow(2, attempt));
          continue;
        }

        // Handle network errors
        if (isRetryableError(error as Error) && attempt < this.retries) {
          logger.warn(`Network error (attempt ${attempt + 1}/${this.retries + 1}), retrying...`, {
            error: (error as Error).message,
            attempt: attempt + 1,
            retries: this.retries,
          });

          await this.delay(this.retryDelay * Math.pow(2, attempt));
          continue;
        }

        // Non-retryable error or max retries reached
        throw createErrorFromNetworkError(error as Error, 'API request');
      }
    }

    throw lastError!;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make a GET request
   */
  async get<T = Record<string, unknown>>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const url = createTemplateApiUrl(this.config, endpoint);
    return this.executeWithRetry<T>({
      method: 'GET',
      url,
      ...config,
    });
  }

  /**
   * Make a POST request
   */
  async post<T = Record<string, unknown>>(endpoint: string, data?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<T> {
    const url = createTemplateApiUrl(this.config, endpoint);
    return this.executeWithRetry<T>({
      method: 'POST',
      url,
      data,
      ...config,
    });
  }

  /**
   * Make a PUT request
   */
  async put<T = Record<string, unknown>>(endpoint: string, data?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<T> {
    const url = createTemplateApiUrl(this.config, endpoint);
    return this.executeWithRetry<T>({
      method: 'PUT',
      url,
      data,
      ...config,
    });
  }

  /**
   * Make a DELETE request
   */
  async delete<T = Record<string, unknown>>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const url = createTemplateApiUrl(this.config, endpoint);
    return this.executeWithRetry<T>({
      method: 'DELETE',
      url,
      ...config,
    });
  }

  /**
   * Make a media API request
   */
  async mediaRequest<T = Record<string, unknown>>(
    method: string,
    endpoint: string,
    data?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const url = createMediaApiUrl(this.config, endpoint);
    return this.executeWithRetry<T>({
      method: method.toUpperCase(),
      url,
      data,
      ...config,
    });
  }

  /**
   * Upload file with FormData
   */
  async uploadFile<T = Record<string, unknown>>(
    endpoint: string,
    file: Buffer | string,
    filename: string,
    mimeType: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const url = createMediaApiUrl(this.config, endpoint);

    // Create FormData
    const FormData = await import('form-data');
    const formData = new FormData.default();
    formData.append('file', file, {
      filename,
      contentType: mimeType,
    });

    return this.executeWithRetry<T>({
      method: 'POST',
      url,
      data: formData,
      headers: {
        ...formData.getHeaders(),
        ...config?.headers,
      },
      ...config,
    });
  }

  /**
   * Get rate limit information
   */
  getRateLimitInfo(): RateLimitInfo {
    return { ...this.rateLimitInfo };
  }

  /**
   * Reset rate limit counter (useful for testing)
   */
  resetRateLimit(): void {
    this.rateLimitInfo.currentRequests = 0;
    this.rateLimitInfo.resetTime = Date.now() + 60000;
  }
}
