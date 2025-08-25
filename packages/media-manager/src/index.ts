// Media Manager Package
// Main entry point for media management with multiple storage providers

// Export new modular components
export { createLogger, MediaLogger } from './logger.js';
export type {
  LogLevel,
  LoggerOptions,
  LogContext
} from './logger.js';

export {
  MediaManagerError,
  MediaConfigError,
  MediaValidationError,
  MediaFileSizeError,
  MediaFileTypeError,
  MediaStorageError,
  MediaUploadError,
  MediaDownloadError,
  MediaDeleteError,
  MediaApiError,
  MediaRateLimitError,
  MediaAuthError,
  MediaNetworkError,
  MediaTimeoutError,
  MediaNotFoundError,
  createErrorFromApiResponse,
  createErrorFromNetworkError,
  createFileValidationError,
  isRetryableError,
  ERROR_CODES,
} from './errors.js';
export type {
  MediaErrorDetails,
  StorageErrorDetails,
  ErrorCode
} from './errors.js';

export {
  validateFile,
  validateFileSize,
  validateFileType,
  validateFileName,
  detectMimeTypeFromBuffer,
  validateFileContent,
  detectMediaType,
  getAllowedTypesForMediaType,
  getMaxFileSizeForMediaType,
  formatFileSize,
  getFileExtension,
  generateSafeFileName,
  DEFAULT_VALIDATION_CONFIG,
} from './validation.js';
export type {
  FileValidationConfig,
  ValidationResult,
  FileInfo
} from './validation.js';

// Export types
export type {
  MediaType,
  UploadMediaParams,
  MediaInfo,
  StorageConfig,
  MediaManagerOptions,
  StorageProvider,
  UploadProgressCallback,
  MediaProcessingOptions,
  MediaMetadata,
  MediaSearchOptions,
  BatchUploadOptions,
  StorageStats,
  HealthCheckResult,
} from './types.js';

// Legacy imports for backward compatibility
import axios, { AxiosError } from "axios";
import FormData from "form-data";
import { logger } from './logger.js';
import { validateFile, DEFAULT_VALIDATION_CONFIG } from './validation.js';
import {
  MediaManagerError,
  createErrorFromApiResponse,
  createErrorFromNetworkError,
  isRetryableError,
  MediaErrorDetails,
} from './errors.js';
import type {
  UploadMediaParams,
  MediaInfo,
  StorageConfig,
  MediaManagerOptions,
  StorageProvider,
} from './types.js';

// WhatsApp storage provider (existing functionality with improvements)
export class WhatsAppStorageProvider implements StorageProvider {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;

  constructor(config: StorageConfig["whatsapp"]) {
    if (!config) throw new Error("WhatsApp config required");
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.accessToken = config.accessToken;
    this.phoneNumberId = config.phoneNumberId;
  }

  async upload(params: UploadMediaParams): Promise<MediaInfo> {
    try {
      logger.logMediaUpload(params.fileName, params.mimeType, params.data instanceof Buffer ? params.data.length : 0, 'started');

      const form = new FormData();
      form.append("file", params.data as unknown as Blob, params.fileName);
      form.append("type", params.mimeType);
      form.append("messaging_product", "whatsapp");

      const url = `${this.baseUrl}/${this.phoneNumberId}/media`;
      const startTime = Date.now();

      const { data } = await axios.post(url, form, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          ...form.getHeaders(),
        },
        timeout: 30000, // 30 second timeout
      });

      const duration = Date.now() - startTime;
      logger.logApiRequest('POST', url, 200, duration);

      const mediaInfo: MediaInfo = {
        id: data.id,
        mimeType: params.mimeType,
        fileName: params.fileName,
        status: "UPLOADED",
        storageProvider: "whatsapp",
        fileSize: params.data instanceof Buffer ? params.data.length : undefined,
        uploadedAt: new Date(),
      };

      logger.logMediaUpload(params.fileName, params.mimeType, mediaInfo.fileSize || 0, 'completed');
      return mediaInfo;
    } catch (error) {
      logger.logMediaUpload(params.fileName, params.mimeType, params.data instanceof Buffer ? params.data.length : 0, 'failed', { error: (error as Error).message });

      if (error instanceof AxiosError) {
        const statusCode = error.response?.status || 0;
        const errorData = error.response?.data as Record<string, unknown>;
        throw createErrorFromApiResponse(statusCode, errorData, 'upload', params.fileName);
      }

      throw createErrorFromNetworkError(error as Error, 'upload');
    }
  }

  async get(mediaId: string): Promise<MediaInfo> {
    try {
      logger.logMediaDownload(mediaId, 'started');

      const url = `${this.baseUrl}/${mediaId}`;
      const startTime = Date.now();

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
        timeout: 10000, // 10 second timeout
      });

      const duration = Date.now() - startTime;
      logger.logApiRequest('GET', url, 200, duration);

      const mediaInfo: MediaInfo = {
        id: data.id,
        url: data.url,
        mimeType: data.mime_type,
        sha256: data.sha256,
        storageProvider: "whatsapp",
      };

      logger.logMediaDownload(mediaId, 'completed');
      return mediaInfo;
    } catch (error) {
      logger.logMediaDownload(mediaId, 'failed', { error: (error as Error).message });

      if (error instanceof AxiosError) {
        const statusCode = error.response?.status || 0;
        const errorData = error.response?.data as Record<string, unknown>;
        throw createErrorFromApiResponse(statusCode, errorData, 'get', mediaId);
      }

      throw createErrorFromNetworkError(error as Error, 'get');
    }
  }

  async delete(mediaId: string): Promise<{ success: boolean }> {
    try {
      logger.logMediaDelete(mediaId, 'started');

      const url = `${this.baseUrl}/${mediaId}`;
      const startTime = Date.now();

      const { data } = await axios.delete(url, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
        timeout: 10000, // 10 second timeout
      });

      const duration = Date.now() - startTime;
      logger.logApiRequest('DELETE', url, 200, duration);

      logger.logMediaDelete(mediaId, 'completed');
      return { success: data.success === true };
    } catch (error) {
      logger.logMediaDelete(mediaId, 'failed', { error: (error as Error).message });

      if (error instanceof AxiosError) {
        const statusCode = error.response?.status || 0;
        const errorData = error.response?.data as Record<string, unknown>;
        throw createErrorFromApiResponse(statusCode, errorData, 'delete', mediaId);
      }

      throw createErrorFromNetworkError(error as Error, 'delete');
    }
  }

  async getUrl(mediaId: string): Promise<string> {
    const info = await this.get(mediaId);
    if (!info.url) throw new Error("Media URL not available");
    return info.url;
  }
}

// Local storage provider (improved implementation)
export class LocalStorageProvider implements StorageProvider {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(config: StorageConfig["local"]) {
    if (!config) throw new Error("Local storage config required");
    this.uploadDir = config.uploadDir;
    this.baseUrl = config.baseUrl;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async upload(_params: UploadMediaParams): Promise<MediaInfo> {
    // Implementation for local file system storage
    // This would save files to local directory and return local path
    throw new Error("Local storage not yet implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async get(_mediaId: string): Promise<MediaInfo> {
    // Implementation for retrieving local file info
    throw new Error("Local storage not yet implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(_mediaId: string): Promise<{ success: boolean }> {
    // Implementation for deleting local files
    throw new Error("Local storage not yet implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getUrl(_mediaId: string): Promise<string> {
    // Return public URL for local file
    throw new Error("Local storage not yet implemented");
  }
}

// S3 storage provider (improved implementation)
export class S3StorageProvider implements StorageProvider {
  private readonly config: StorageConfig["s3"];

  constructor(config: StorageConfig["s3"]) {
    if (!config) throw new Error("S3 config required");
    this.config = config;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async upload(_params: UploadMediaParams): Promise<MediaInfo> {
    // Implementation for S3 upload
    throw new Error("S3 storage not yet implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async get(_mediaId: string): Promise<MediaInfo> {
    // Implementation for S3 file info
    throw new Error("S3 storage not yet implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(_mediaId: string): Promise<{ success: boolean }> {
    // Implementation for S3 file deletion
    throw new Error("S3 storage not yet implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getUrl(_mediaId: string): Promise<string> {
    // Return S3 presigned URL or public URL
    throw new Error("S3 storage not yet implemented");
  }
}

// Google Cloud Storage provider (improved implementation)
export class GCSStorageProvider implements StorageProvider {
  private readonly config: StorageConfig["gcs"];

  constructor(config: StorageConfig["gcs"]) {
    if (!config) throw new Error("GCS config required");
    this.config = config;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async upload(_params: UploadMediaParams): Promise<MediaInfo> {
    // Implementation for GCS upload
    throw new Error("GCS storage not yet implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async get(_mediaId: string): Promise<MediaInfo> {
    // Implementation for GCS file info
    throw new Error("GCS storage not yet implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(_mediaId: string): Promise<{ success: boolean }> {
    // Implementation for GCS file deletion
    throw new Error("GCS storage not yet implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getUrl(_mediaId: string): Promise<string> {
    // Return GCS public URL or signed URL
    throw new Error("GCS storage not yet implemented");
  }
}

// Factory function to create storage providers
function createStorageProvider(config: StorageConfig): StorageProvider {
  switch (config.provider) {
    case "whatsapp":
      return new WhatsAppStorageProvider(config.whatsapp);
    case "local":
      return new LocalStorageProvider(config.local);
    case "s3":
      return new S3StorageProvider(config.s3);
    case "gcs":
      return new GCSStorageProvider(config.gcs);
    default:
      throw new Error(`Unsupported storage provider: ${config.provider}`);
  }
}

// Main MediaManager class that orchestrates storage providers (improved implementation)
export class MediaManager {
  private readonly primaryStorage: StorageProvider;
  private readonly fallbackStorage?: StorageProvider;
  private readonly validationConfig: typeof DEFAULT_VALIDATION_CONFIG;

  constructor(options: MediaManagerOptions) {
    this.primaryStorage = createStorageProvider(options.storage);
    if (options.fallbackStorage) {
      this.fallbackStorage = createStorageProvider(options.fallbackStorage);
    }
    this.validationConfig = DEFAULT_VALIDATION_CONFIG;
  }

  async upload(params: UploadMediaParams): Promise<MediaInfo> {
    try {
      // Validate file before upload
      if (params.data instanceof Buffer) {
        const fileInfo = {
          fileName: params.fileName,
          mimeType: params.mimeType,
          fileSize: params.data.length,
          buffer: params.data,
        };

        const validation = validateFile(fileInfo, this.validationConfig);
        if (!validation.isValid) {
          throw new MediaManagerError(
            `File validation failed: ${validation.errors.join(', ')}`,
            'MEDIA_VALIDATION_ERROR',
            {
              details: {
                fileName: params.fileName,
                mimeType: params.mimeType,
                fileSize: params.data.length,
                validationErrors: validation.errors,
              } as MediaErrorDetails
            }
          );
        }
      }

      return await this.primaryStorage.upload(params);
    } catch (error) {
      if (this.fallbackStorage && isRetryableError(error as Error)) {
        logger.warn("Primary storage failed, trying fallback", { error: (error as Error).message });
        return await this.fallbackStorage.upload(params);
      }
      throw error;
    }
  }

  async get(mediaId: string): Promise<MediaInfo> {
    try {
      return await this.primaryStorage.get(mediaId);
    } catch (error) {
      if (this.fallbackStorage && isRetryableError(error as Error)) {
        logger.warn("Primary storage failed, trying fallback", { error: (error as Error).message });
        return await this.fallbackStorage.get(mediaId);
      }
      throw error;
    }
  }

  async delete(mediaId: string): Promise<{ success: boolean }> {
    try {
      return await this.primaryStorage.delete(mediaId);
    } catch (error) {
      if (this.fallbackStorage && isRetryableError(error as Error)) {
        logger.warn("Primary storage failed, trying fallback", { error: (error as Error).message });
        return await this.fallbackStorage.delete(mediaId);
      }
      throw error;
    }
  }

  async getUrl(mediaId: string): Promise<string> {
    try {
      return await this.primaryStorage.getUrl(mediaId);
    } catch (error) {
      if (this.fallbackStorage && isRetryableError(error as Error)) {
        logger.warn("Primary storage failed, trying fallback", { error: (error as Error).message });
        return await this.fallbackStorage.getUrl(mediaId);
      }
      throw error;
    }
  }

  // Method to get storage provider info
  getStorageInfo(): { primary: string; fallback?: string } {
    return {
      primary: this.primaryStorage.constructor.name,
      fallback: this.fallbackStorage?.constructor.name,
    };
  }
}

// Legacy support - maintain backward compatibility
export class LegacyMediaManager extends MediaManager {
  constructor(options: {
    baseUrl: string;
    accessToken: string;
    phoneNumberId: string;
  }) {
    super({
      storage: {
        provider: "whatsapp",
        whatsapp: options,
      },
    });
  }
}

// Export configuration utilities
export * from "./config.js";
export * from "./examples.js";
