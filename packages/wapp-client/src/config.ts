// WhatsApp Client Configuration
// Centralized configuration management for WhatsApp Business API

import "dotenv/config";
import path from "path";

// Load environment variables from the project root
import { config } from "dotenv";
config({ path: path.resolve(process.cwd(), "../../.env") });

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  apiVersion: string;
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

export interface WhatsAppClientOptions {
  phoneNumberId?: string;
  accessToken?: string;
  apiVersion?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export function createWhatsAppConfig(options: WhatsAppClientOptions = {}): WhatsAppConfig {
  const phoneNumberId = options.phoneNumberId || process.env.PHONE_NUMBER_ID;
  const accessToken = options.accessToken || process.env.ACCESS_TOKEN;
  const apiVersion = options.apiVersion || process.env.META_API_VERSION || "v21.0";
  
  if (!phoneNumberId) {
    throw new Error("WhatsApp Phone Number ID is required. Set PHONE_NUMBER_ID environment variable or pass it in options.");
  }
  
  if (!accessToken) {
    throw new Error("WhatsApp Access Token is required. Set ACCESS_TOKEN environment variable or pass it in options.");
  }

  return {
    phoneNumberId,
    accessToken,
    apiVersion,
    baseUrl: `https://graph.facebook.com/${apiVersion}/${phoneNumberId}`,
    timeout: options.timeout || 30000, // 30 seconds
    retries: options.retries || 3,
    retryDelay: options.retryDelay || 1000, // 1 second
  };
}

export function validateWhatsAppConfig(config: WhatsAppConfig): void {
  if (!config.phoneNumberId) {
    throw new Error("Phone Number ID is required");
  }
  
  if (!config.accessToken) {
    throw new Error("Access Token is required");
  }
  
  if (!config.apiVersion) {
    throw new Error("API Version is required");
  }
  
  if (config.timeout <= 0) {
    throw new Error("Timeout must be greater than 0");
  }
  
  if (config.retries < 0) {
    throw new Error("Retries must be non-negative");
  }
  
  if (config.retryDelay < 0) {
    throw new Error("Retry delay must be non-negative");
  }
}
