// WhatsApp Client Package
// Main entry point for WhatsApp Business API client

// Export the main client class and factory function
export { WhatsAppClient, createWhatsAppClient } from './client';
export type { 
  WhatsAppClientInterface 
} from './client';

// Export configuration types and utilities
export { createWhatsAppConfig, validateWhatsAppConfig } from './config';
export type { WhatsAppConfig, WhatsAppClientOptions } from './config';

// Export error classes
export {
  WhatsAppError,
  WhatsAppConfigError,
  WhatsAppValidationError,
  WhatsAppApiError,
  WhatsAppRateLimitError,
  WhatsAppAuthenticationError,
  WhatsAppNetworkError,
  WhatsAppTimeoutError,
  createErrorFromResponse,
  isRetryableStatusCode,
  ERROR_CODES,
} from './errors';
export type { ErrorCode } from './errors';

// Export logger
export { WhatsAppLogger, logger } from './logger';
export type { LogLevel, LoggerOptions } from './logger';

// Export validation utilities
export {
  validatePhoneNumber,
  validateTextMessage,
  validateTemplateName,
  validateUrl,
  validateTemplateParameters,
  validateTextMessageArgs,
  validateTemplateMessageArgs,
  validateInput,
} from './validation';
export type { ValidationResult } from './validation';

// Export HTTP client
export { WhatsAppHttpClient } from './http-client';
export type { HttpClientOptions } from './http-client';

// Re-export types from @whatssuite/types for convenience
export type {
  WhatsAppMessagePayload,
  WhatsAppApiResponse,
  WhatsAppMessageComponent,
  WhatsAppTemplate,
  WhatsAppTemplateComponent
} from "@whatssuite/types";

// Legacy exports for backward compatibility
import { WhatsAppClient } from './client';
import type { WhatsAppApiResponse } from "@whatssuite/types";

// Legacy interface for backward compatibility
export interface SendTemplateMessageArgs {
  to: string;
  templateName: string;
  bodyParams?: string[];
  buttonParams?: string[];
  imageUrl?: string;
  documentUrl?: string;
  filename?: string;
}

export interface SendTextMessageArgs {
  to: string;
  text: string;
}

// Legacy client object for backward compatibility
export const wappClient = {
  async sendTextMessage(args: SendTextMessageArgs): Promise<WhatsAppApiResponse> {
    const client = new WhatsAppClient();
    return client.sendTextMessage(args);
  },

  async sendTemplateMessage(args: SendTemplateMessageArgs): Promise<WhatsAppApiResponse> {
    const client = new WhatsAppClient();
    return client.sendTemplateMessage(args);
  },
};

// Legacy type alias for backward compatibility
export type WhatsAppSuccessResponse = WhatsAppApiResponse;
