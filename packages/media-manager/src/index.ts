import axios from "axios";
import FormData from "form-data";

export type MediaType = "image" | "video" | "audio" | "document";

export interface UploadMediaParams {
  type: MediaType;
  fileName: string;
  mimeType: string;
  // Accept raw bytes or a readable stream from Node.js
  data: Buffer | NodeJS.ReadableStream;
}

export interface MediaInfo {
  id: string;
  url?: string;
  sha256?: string;
  mimeType: string;
  fileName?: string;
  status?: "UPLOADED" | "PENDING" | "FAILED";
  storageProvider?: string; // Track which storage provider was used
  localPath?: string; // For local storage
}

export interface StorageConfig {
  provider: "whatsapp" | "local" | "s3" | "gcs";
  // WhatsApp-specific config
  whatsapp?: {
    baseUrl: string;
    accessToken: string;
    phoneNumberId: string;
  };
  // Local storage config
  local?: {
    uploadDir: string;
    baseUrl: string; // Public URL for serving files
  };
  // S3 config
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string; // For custom S3-compatible services
  };
  // Google Cloud Storage config
  gcs?: {
    bucket: string;
    projectId: string;
    keyFilename?: string; // Path to service account key file
    credentials?: Record<string, unknown>; // Direct credentials object
  };
}

export interface MediaManagerOptions {
  storage: StorageConfig;
  // Optional: fallback storage if primary fails
  fallbackStorage?: StorageConfig;
}

// Abstract storage interface
export interface StorageProvider {
  upload(params: UploadMediaParams): Promise<MediaInfo>;
  get(mediaId: string): Promise<MediaInfo>;
  delete(mediaId: string): Promise<{ success: boolean }>;
  getUrl(mediaId: string): Promise<string>;
}

// WhatsApp storage provider (existing functionality)
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
    const form = new FormData();
    form.append("file", params.data as unknown as Blob, params.fileName);
    form.append("type", params.mimeType);
    form.append("messaging_product", "whatsapp");

    const url = `${this.baseUrl}/${this.phoneNumberId}/media`;
    const { data } = await axios.post(url, form, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...form.getHeaders(),
      },
    });

    return { 
      id: data.id, 
      mimeType: params.mimeType, 
      fileName: params.fileName, 
      status: "UPLOADED",
      storageProvider: "whatsapp"
    };
  }

  async get(mediaId: string): Promise<MediaInfo> {
    const url = `${this.baseUrl}/${mediaId}`;
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    return { 
      id: data.id, 
      url: data.url, 
      mimeType: data.mime_type, 
      sha256: data.sha256,
      storageProvider: "whatsapp"
    };
  }

  async delete(mediaId: string): Promise<{ success: boolean }> {
    const url = `${this.baseUrl}/${mediaId}`;
    const { data } = await axios.delete(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    return { success: data.success === true };
  }

  async getUrl(mediaId: string): Promise<string> {
    const info = await this.get(mediaId);
    if (!info.url) throw new Error("Media URL not available");
    return info.url;
  }
}

// Local storage provider
export class LocalStorageProvider implements StorageProvider {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(config: StorageConfig["local"]) {
    if (!config) throw new Error("Local storage config required");
    this.uploadDir = config.uploadDir;
    this.baseUrl = config.baseUrl;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async upload(params: UploadMediaParams): Promise<MediaInfo> {
    // Implementation for local file system storage
    // This would save files to local directory and return local path
    throw new Error("Local storage not yet implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async get(mediaId: string): Promise<MediaInfo> {
    // Implementation for retrieving local file info
    throw new Error("Local storage not yet implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(mediaId: string): Promise<{ success: boolean }> {
    // Implementation for deleting local files
    throw new Error("Local storage not yet implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getUrl(mediaId: string): Promise<string> {
    // Return public URL for local file
    throw new Error("Local storage not yet implemented");
  }
}

// S3 storage provider
export class S3StorageProvider implements StorageProvider {
  private readonly config: StorageConfig["s3"];

  constructor(config: StorageConfig["s3"]) {
    if (!config) throw new Error("S3 config required");
    this.config = config;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async upload(params: UploadMediaParams): Promise<MediaInfo> {
    // Implementation for S3 upload
    throw new Error("S3 storage not yet implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async get(mediaId: string): Promise<MediaInfo> {
    // Implementation for S3 file info
    throw new Error("S3 storage not yet implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(mediaId: string): Promise<{ success: boolean }> {
    // Implementation for S3 file deletion
    throw new Error("S3 storage not yet implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getUrl(mediaId: string): Promise<string> {
    // Return S3 presigned URL or public URL
    throw new Error("S3 storage not yet implemented");
  }
}

// Google Cloud Storage provider
export class GCSStorageProvider implements StorageProvider {
  private readonly config: StorageConfig["gcs"];

  constructor(config: StorageConfig["gcs"]) {
    if (!config) throw new Error("GCS config required");
    this.config = config;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async upload(params: UploadMediaParams): Promise<MediaInfo> {
    // Implementation for GCS upload
    throw new Error("GCS storage not yet implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async get(mediaId: string): Promise<MediaInfo> {
    // Implementation for GCS file info
    throw new Error("GCS storage not yet implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(mediaId: string): Promise<{ success: boolean }> {
    // Implementation for GCS file deletion
    throw new Error("GCS storage not yet implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getUrl(mediaId: string): Promise<string> {
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

// Main MediaManager class that orchestrates storage providers
export class MediaManager {
  private readonly primaryStorage: StorageProvider;
  private readonly fallbackStorage?: StorageProvider;

  constructor(options: MediaManagerOptions) {
    this.primaryStorage = createStorageProvider(options.storage);
    if (options.fallbackStorage) {
      this.fallbackStorage = createStorageProvider(options.fallbackStorage);
    }
  }

  async upload(params: UploadMediaParams): Promise<MediaInfo> {
    try {
      return await this.primaryStorage.upload(params);
    } catch (error) {
      if (this.fallbackStorage) {
        console.warn("Primary storage failed, trying fallback:", error);
        return await this.fallbackStorage.upload(params);
      }
      throw error;
    }
  }

  async get(mediaId: string): Promise<MediaInfo> {
    try {
      return await this.primaryStorage.get(mediaId);
    } catch (error) {
      if (this.fallbackStorage) {
        console.warn("Primary storage failed, trying fallback:", error);
        return await this.fallbackStorage.get(mediaId);
      }
      throw error;
    }
  }

  async delete(mediaId: string): Promise<{ success: boolean }> {
    try {
      return await this.primaryStorage.delete(mediaId);
    } catch (error) {
      if (this.fallbackStorage) {
        console.warn("Primary storage failed, trying fallback:", error);
        return await this.fallbackStorage.delete(mediaId);
      }
      throw error;
    }
  }

  async getUrl(mediaId: string): Promise<string> {
    try {
      return await this.primaryStorage.getUrl(mediaId);
    } catch (error) {
      if (this.fallbackStorage) {
        console.warn("Primary storage failed, trying fallback:", error);
        return await this.fallbackStorage.getUrl(mediaId);
      }
      throw error;
    }
  }

  // Method to get storage provider info
  getStorageInfo(): { primary: string; fallback?: string } {
    return {
      primary: this.primaryStorage.constructor.name,
      fallback: this.fallbackStorage?.constructor.name
    };
  }
}

// Legacy support - maintain backward compatibility
export class LegacyMediaManager extends MediaManager {
  constructor(options: { baseUrl: string; accessToken: string; phoneNumberId: string }) {
    super({
      storage: {
        provider: "whatsapp",
        whatsapp: options
      }
    });
  }
}

// Export configuration utilities
export * from "./config";
export * from "./examples";
