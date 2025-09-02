// WhatsApp HTTP Client
// HTTP client with retry logic, error handling, and logging for WhatsApp Business API

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, isAxiosError } from 'axios';
import { WhatsAppConfig } from './config';
import { logger } from './logger';
import { 
  WhatsAppError, 
  WhatsAppApiError, 
  WhatsAppNetworkError, 
  WhatsAppTimeoutError,
  createErrorFromResponse 
} from './errors';

export interface HttpClientOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class WhatsAppHttpClient {
  private axiosInstance: AxiosInstance;
  private config: WhatsAppConfig;
  private retries: number;
  private retryDelay: number;

  constructor(config: WhatsAppConfig, options: HttpClientOptions = {}) {
    this.config = config;
    this.retries = options.retries || config.retries;
    this.retryDelay = options.retryDelay || config.retryDelay;

    this.axiosInstance = axios.create({
      timeout: options.timeout || config.timeout,
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        logger.logRequest(config.method?.toUpperCase() || 'GET', config.url || '', config.data);
        return config;
      },
      (error) => {
        logger.error('Request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        logger.logResponse(response.status, response.data);
        return response;
      },
      (error) => {
        if (isAxiosError(error)) {
          logger.logError(error.response?.status || 0, error, error.config?.data);
        }
        return Promise.reject(error);
      }
    );
  }

  async request<T = any>(
    method: string,
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const requestConfig: AxiosRequestConfig = {
      method,
      url,
      data,
      ...config,
    };

    return this.executeWithRetry(requestConfig);
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('GET', url, undefined, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('POST', url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PUT', url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config);
  }

  private async executeWithRetry<T>(config: AxiosRequestConfig): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response = await this.axiosInstance.request<T>(config);
        return response.data;
      } catch (error) {
        lastError = error as Error;
        
        if (!isAxiosError(error)) {
          // Non-HTTP error (network, timeout, etc.)
          if (attempt < this.retries) {
            logger.warn(`Request failed (attempt ${attempt + 1}/${this.retries + 1}), retrying...`, {
              error: (error as Error).message,
              attempt: attempt + 1,
              retries: this.retries,
            });
            await this.delay(this.retryDelay * Math.pow(2, attempt)); // Exponential backoff
            continue;
          }
          
          // Max retries reached for non-HTTP error
          throw new WhatsAppNetworkError(
            `Request failed after ${this.retries + 1} attempts: ${(error as Error).message}`,
            error as Error
          );
        }

        // HTTP error
        const statusCode = error.response?.status || 0;
        const errorData = error.response?.data;
        
        // Create appropriate error
        const whatsappError = createErrorFromResponse(statusCode, errorData, error);
        
        // Check if we should retry
        if (whatsappError.isRetryable && attempt < this.retries) {
          logger.warn(`HTTP request failed (attempt ${attempt + 1}/${this.retries + 1}), retrying...`, {
            statusCode,
            error: whatsappError.message,
            attempt: attempt + 1,
            retries: this.retries,
          });
          
          // For rate limiting, use the retry-after header if available
          let delay = this.retryDelay * Math.pow(2, attempt);
          if (statusCode === 429 && error.response?.headers?.['retry-after']) {
            const retryAfter = parseInt(error.response.headers['retry-after'], 10);
            if (!isNaN(retryAfter)) {
              delay = retryAfter * 1000; // Convert to milliseconds
            }
          }
          
          await this.delay(delay);
          continue;
        }
        
        // Don't retry or max retries reached
        throw whatsappError;
      }
    }
    
    // This should never be reached, but just in case
    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper method to build full URL
  buildUrl(endpoint: string): string {
    return `${this.config.baseUrl}${endpoint}`;
  }

  // Helper method to get headers
  getHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.accessToken}`,
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };
  }
}
