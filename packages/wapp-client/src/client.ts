// WhatsApp Client
// Main client class for WhatsApp Business API

import type {
  WhatsAppMessagePayload,
  WhatsAppApiResponse,
  WhatsAppMessageComponent
} from "@buievo/types";

import { createWhatsAppConfig, validateWhatsAppConfig, WhatsAppConfig, WhatsAppClientOptions } from './config';
import { logger } from './logger';
import { WhatsAppConfigError } from './errors';
import { validateTextMessageArgs, validateTemplateMessageArgs } from './validation';
import { WhatsAppHttpClient } from './http-client';

export interface SendTextMessageArgs {
  to: string;
  text: string;
}

export interface SendTemplateMessageArgs {
  to: string;
  templateName: string;
  bodyParams?: string[];
  buttonParams?: string[];
  imageUrl?: string;
  documentUrl?: string;
  filename?: string;
}

export interface WhatsAppClientInterface {
  sendTextMessage(args: SendTextMessageArgs): Promise<WhatsAppApiResponse>;
  sendTemplateMessage(args: SendTemplateMessageArgs): Promise<WhatsAppApiResponse>;
}

export class WhatsAppClient implements WhatsAppClientInterface {
  private config: WhatsAppConfig;
  private httpClient: WhatsAppHttpClient;

  constructor(options: WhatsAppClientOptions = {}) {
    try {
      this.config = createWhatsAppConfig(options);
      validateWhatsAppConfig(this.config);
      
      this.httpClient = new WhatsAppHttpClient(this.config, {
        timeout: this.config.timeout,
        retries: this.config.retries,
        retryDelay: this.config.retryDelay,
      });

      logger.logConfiguration(this.config);
      logger.info('WhatsApp client initialized successfully');
    } catch (error) {
      throw new WhatsAppConfigError(
        `Failed to initialize WhatsApp client: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { originalError: error }
      );
    }
  }

  async sendTextMessage(args: SendTextMessageArgs): Promise<WhatsAppApiResponse> {
    logger.info('Sending text message', { to: args.to, textLength: args.text.length });

    // Validate input
    validateTextMessageArgs(args);

    const payload: WhatsAppMessagePayload = {
      messaging_product: "whatsapp",
      to: args.to,
      type: "text",
      text: {
        body: args.text,
      },
    };

    try {
      const response = await this.httpClient.post<WhatsAppApiResponse>(
        '/messages',
        payload
      );

      logger.info('Text message sent successfully', {
        to: args.to,
        messageId: response.messages?.[0]?.id,
      });

      return response;
    } catch (error) {
      logger.error('Failed to send text message', {
        to: args.to,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async sendTemplateMessage(args: SendTemplateMessageArgs): Promise<WhatsAppApiResponse> {
    logger.info('Sending template message', {
      to: args.to,
      templateName: args.templateName,
      bodyParamsCount: args.bodyParams?.length || 0,
      buttonParamsCount: args.buttonParams?.length || 0,
    });

    // Validate input
    validateTemplateMessageArgs(args);

    const components: WhatsAppMessageComponent[] = [];

    // Add image component if imageUrl is provided
    if (args.imageUrl) {
      components.push({
        type: "HEADER",
        parameters: [
          {
            type: "image",
            image: {
              link: args.imageUrl,
            },
          },
        ],
      });
    }

    // Add document component if documentUrl is provided
    if (args.documentUrl) {
      components.push({
        type: "HEADER",
        parameters: [
          {
            type: "document",
            document: {
              link: args.documentUrl,
              ...(args.filename && { filename: args.filename }),
            },
          },
        ],
      });
    }

    // Add body parameters
    if (args.bodyParams && args.bodyParams.length > 0) {
      components.push({
        type: "BODY",
        parameters: args.bodyParams.map((param) => ({
          type: "text",
          text: param,
        })),
      });
    }

    // Add button parameters (for dynamic URLs)
    if (args.buttonParams && args.buttonParams.length > 0) {
      args.buttonParams.forEach((param, index) => {
        components.push({
          type: "BUTTONS",
          sub_type: "url",
          index, // index must match button index in the template
          parameters: [
            {
              type: "text",
              text: param,
            },
          ],
        });
      });
    }

    const payload = {
      messaging_product: "whatsapp" as const,
      to: args.to,
      type: "template" as const,
      template: {
        name: args.templateName,
        language: { code: "en_US" },
        components,
      },
    };

    try {
      const response = await this.httpClient.post<WhatsAppApiResponse>(
        '/messages',
        payload
      );

      logger.info('Template message sent successfully', {
        to: args.to,
        templateName: args.templateName,
        messageId: response.messages?.[0]?.id,
      });

      return response;
    } catch (error) {
      logger.error('Failed to send template message', {
        to: args.to,
        templateName: args.templateName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // Getter for configuration (read-only)
  get configuration(): Readonly<WhatsAppConfig> {
    return Object.freeze({ ...this.config });
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      // Try to make a simple request to verify connectivity
      await this.httpClient.get('/messages');
      return true;
    } catch (error) {
      logger.warn('Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}

// Factory function for creating a WhatsApp client
export function createWhatsAppClient(options: WhatsAppClientOptions = {}): WhatsAppClient {
  return new WhatsAppClient(options);
}

// Default export for backward compatibility
export default WhatsAppClient;
