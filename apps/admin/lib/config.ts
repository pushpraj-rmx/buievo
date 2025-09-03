import { useState, useEffect } from 'react';

// Centralized Configuration Management for buievo
// This service manages all application settings and provides a single source of truth

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  wabaId: string;
  webhookVerifyToken: string;
  apiVersion: string;
  isEnabled: boolean;
}

export interface StorageConfig {
  provider: 'whatsapp' | 'local' | 's3' | 'gcs';
  maxFileSize: number;
  retentionDays: number;
  compressionEnabled: boolean;
  allowedTypes: string[];
}

export interface APIConfig {
  corsOrigin: string;
  rateLimit: number;
  webhookUrl: string;
  apiKey: string;
  enableSwagger: boolean;
}

export interface NotificationConfig {
  emailNotifications: boolean;
  webhookNotifications: boolean;
  campaignAlerts: boolean;
  errorAlerts: boolean;
  emailAddress: string;
}

export interface WorkerAreaConfig {
  autoOpen: boolean;
  showNotifications: boolean;
  maxHistoryItems: number;
  autoClearCompleted: boolean;
  clearAfterDays: number;
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  accentColor: string;
}

export interface SidebarConfig {
  width: string;
  collapsible: boolean;
  position: 'left' | 'right';
  defaultCollapsed: boolean;
}

export interface LocalizationConfig {
  language: string;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  numberFormat: string;
}

export interface AdvancedStorageConfig {
  fallbackProvider: 'whatsapp' | 'local' | 's3' | 'gcs' | null;
  enableFallback: boolean;
  retryAttempts: number;
  retryDelay: number;
  // S3 specific
  s3Region?: string;
  s3Endpoint?: string;
  // GCS specific
  gcsProjectId?: string;
  gcsKeyFilename?: string;
}

export interface AppConfig {
  whatsapp: WhatsAppConfig;
  storage: StorageConfig;
  api: APIConfig;
  notifications: NotificationConfig;
  workerArea: WorkerAreaConfig;
  theme: ThemeConfig;
  sidebar: SidebarConfig;
  localization: LocalizationConfig;
  advancedStorage: AdvancedStorageConfig;
  version: string;
  environment: 'development' | 'production' | 'staging';
}

// Default configuration
export const defaultConfig: AppConfig = {
  whatsapp: {
    phoneNumberId: '',
    accessToken: '',
    wabaId: '',
    webhookVerifyToken: '',
    apiVersion: 'v21.0',
    isEnabled: false,
  },
  storage: {
    provider: 'whatsapp',
    maxFileSize: 16,
    retentionDays: 30,
    compressionEnabled: true,
    allowedTypes: [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'video/mp4',
      'application/pdf',
      'text/plain'
    ],
  },
  api: {
    corsOrigin: '*',
    rateLimit: 100,
    webhookUrl: '',
    apiKey: '',
    enableSwagger: true,
  },
  notifications: {
    emailNotifications: true,
    webhookNotifications: false,
    campaignAlerts: true,
    errorAlerts: true,
    emailAddress: '',
  },
  workerArea: {
    autoOpen: true,
    showNotifications: true,
    maxHistoryItems: 50,
    autoClearCompleted: false,
    clearAfterDays: 7,
  },
  theme: {
    mode: 'light',
    primaryColor: '#3b82f6',
    accentColor: '#8b5cf6',
  },
  sidebar: {
    width: '16rem',
    collapsible: true,
    position: 'left',
    defaultCollapsed: false,
  },
  localization: {
    language: 'en',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'HH:mm',
    timezone: 'UTC',
    numberFormat: 'en-US',
  },
  advancedStorage: {
    fallbackProvider: null,
    enableFallback: false,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  version: '1.0.0',
  environment: 'development',
};

class ConfigService {
  private config: AppConfig = defaultConfig;
  private listeners: ((config: AppConfig) => void)[] = [];

  constructor() {
    this.loadConfig();
  }

  // Load configuration from localStorage or API
  private async loadConfig() {
    try {
      // Try to load from localStorage first (only in browser)
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedConfig = localStorage.getItem('buievo-config');
        if (savedConfig) {
          this.config = { ...defaultConfig, ...JSON.parse(savedConfig) };
        }
      }

      // Then try to load from API (only on client side)
      if (typeof window !== 'undefined') {
        await this.loadFromAPI();
        this.saveToLocalStorage();
      }
    } catch (error) {
      console.warn('Failed to load configuration:', error);
    }
  }

  // Load configuration from API
  private async loadFromAPI() {
    try {
      // Skip API loading during build time
      if (typeof window === 'undefined') {
        return;
      }

      // Use absolute URL for server-side rendering
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/api/v1/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const apiConfig = await response.json();
        this.config = { ...this.config, ...apiConfig };
      }
    } catch (error) {
      console.warn('Failed to load configuration from API:', error);
    }
  }

  // Save configuration to localStorage
  private saveToLocalStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('buievo-config', JSON.stringify(this.config));
      }
    } catch (error) {
      console.warn('Failed to save configuration to localStorage:', error);
    }
  }

  // Save configuration to API
  private async saveToAPI() {
    try {
      // Skip API saving during build time
      if (typeof window === 'undefined') {
        return;
      }

      // Use absolute URL for server-side rendering
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/api/v1/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.config),
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration to API');
      }
    } catch (error) {
      console.error('Failed to save configuration to API:', error);
      throw error;
    }
  }

  // Get entire configuration
  getConfig(): AppConfig {
    return { ...this.config };
  }

  // Get specific configuration section
  getWhatsAppConfig(): WhatsAppConfig {
    return { ...this.config.whatsapp };
  }

  getStorageConfig(): StorageConfig {
    return { ...this.config.storage };
  }

  getAPIConfig(): APIConfig {
    return { ...this.config.api };
  }

  getNotificationConfig(): NotificationConfig {
    return { ...this.config.notifications };
  }

  getWorkerAreaConfig(): WorkerAreaConfig {
    return { ...this.config.workerArea };
  }

  getThemeConfig(): ThemeConfig {
    return { ...this.config.theme };
  }

  getSidebarConfig(): SidebarConfig {
    return { ...this.config.sidebar };
  }

  getLocalizationConfig(): LocalizationConfig {
    return { ...this.config.localization };
  }

  getAdvancedStorageConfig(): AdvancedStorageConfig {
    return { ...this.config.advancedStorage };
  }

  // Update specific configuration sections
  async updateWhatsAppConfig(config: Partial<WhatsAppConfig>) {
    this.config.whatsapp = { ...this.config.whatsapp, ...config };
    await this.saveConfig();
  }

  async updateStorageConfig(config: Partial<StorageConfig>) {
    this.config.storage = { ...this.config.storage, ...config };
    await this.saveConfig();
  }

  async updateAPIConfig(config: Partial<APIConfig>) {
    this.config.api = { ...this.config.api, ...config };
    await this.saveConfig();
  }

  async updateNotificationConfig(config: Partial<NotificationConfig>) {
    this.config.notifications = { ...this.config.notifications, ...config };
    await this.saveConfig();
  }

  async updateWorkerAreaConfig(config: Partial<WorkerAreaConfig>) {
    this.config.workerArea = { ...this.config.workerArea, ...config };
    await this.saveConfig();
  }

  async updateThemeConfig(config: Partial<ThemeConfig>) {
    this.config.theme = { ...this.config.theme, ...config };
    await this.saveConfig();
  }

  async updateSidebarConfig(config: Partial<SidebarConfig>) {
    this.config.sidebar = { ...this.config.sidebar, ...config };
    await this.saveConfig();
  }

  async updateLocalizationConfig(config: Partial<LocalizationConfig>) {
    this.config.localization = { ...this.config.localization, ...config };
    await this.saveConfig();
  }

  async updateAdvancedStorageConfig(config: Partial<AdvancedStorageConfig>) {
    this.config.advancedStorage = { ...this.config.advancedStorage, ...config };
    await this.saveConfig();
  }

  // Update entire configuration
  async updateConfig(config: Partial<AppConfig>) {
    this.config = { ...this.config, ...config };
    await this.saveConfig();
  }

  // Save configuration (both localStorage and API)
  private async saveConfig() {
    this.saveToLocalStorage();
    await this.saveToAPI();
    this.notifyListeners();
  }

  // Subscribe to configuration changes
  subscribe(listener: (config: AppConfig) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners of configuration changes
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.config));
  }

  // Test WhatsApp connection
  async testWhatsAppConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/v1/whatsapp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.config.whatsapp),
      });

      return response.ok;
    } catch (error) {
      console.error('WhatsApp connection test failed:', error);
      return false;
    }
  }

  // Validate configuration
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate WhatsApp config
    if (this.config.whatsapp.isEnabled) {
      if (!this.config.whatsapp.phoneNumberId) {
        errors.push('WhatsApp Phone Number ID is required');
      }
      if (!this.config.whatsapp.accessToken) {
        errors.push('WhatsApp Access Token is required');
      }
      if (!this.config.whatsapp.wabaId) {
        errors.push('WhatsApp Business Account ID is required');
      }
    }

    // Validate storage config
    if (this.config.storage.maxFileSize <= 0) {
      errors.push('Maximum file size must be greater than 0');
    }
    if (this.config.storage.retentionDays <= 0) {
      errors.push('Retention period must be greater than 0');
    }

    // Validate API config
    if (this.config.api.rateLimit <= 0) {
      errors.push('Rate limit must be greater than 0');
    }

    // Validate notification config
    if (this.config.notifications.emailNotifications && !this.config.notifications.emailAddress) {
      errors.push('Email address is required when email notifications are enabled');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Reset configuration to defaults
  async resetConfig() {
    this.config = { ...defaultConfig };
    await this.saveConfig();
  }

  // Export configuration
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  // Import configuration
  async importConfig(configJson: string) {
    try {
      const importedConfig = JSON.parse(configJson);
      this.config = { ...defaultConfig, ...importedConfig };
      await this.saveConfig();
      return true;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      return false;
    }
  }
}

// Create singleton instance
export const configService = new ConfigService();

// React hook for using configuration
export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(configService.getConfig());

  useEffect(() => {
    const unsubscribe = configService.subscribe(setConfig);
    return unsubscribe;
  }, []);

  return {
    config,
    updateWhatsAppConfig: configService.updateWhatsAppConfig.bind(configService),
    updateStorageConfig: configService.updateStorageConfig.bind(configService),
    updateAPIConfig: configService.updateAPIConfig.bind(configService),
    updateNotificationConfig: configService.updateNotificationConfig.bind(configService),
    updateWorkerAreaConfig: configService.updateWorkerAreaConfig.bind(configService),
    updateThemeConfig: configService.updateThemeConfig.bind(configService),
    updateSidebarConfig: configService.updateSidebarConfig.bind(configService),
    updateLocalizationConfig: configService.updateLocalizationConfig.bind(configService),
    updateAdvancedStorageConfig: configService.updateAdvancedStorageConfig.bind(configService),
    updateConfig: configService.updateConfig.bind(configService),
    testWhatsAppConnection: configService.testWhatsAppConnection.bind(configService),
    validateConfig: configService.validateConfig.bind(configService),
    resetConfig: configService.resetConfig.bind(configService),
    exportConfig: configService.exportConfig.bind(configService),
    importConfig: configService.importConfig.bind(configService),
  };
}

// Types are already exported with their declarations above
