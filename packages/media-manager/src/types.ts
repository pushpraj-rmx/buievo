// Types for Media Manager
// Centralized type definitions

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
  fileSize?: number;
  uploadedAt?: Date;
  metadata?: Record<string, unknown>;
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
  // Validation configuration
  validation?: {
    enabled: boolean;
    maxFileSize: number;
    allowedTypes: string[];
  };
  // Logging configuration
  logging?: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}

// Abstract storage interface
export interface StorageProvider {
  upload(params: UploadMediaParams): Promise<MediaInfo>;
  get(mediaId: string): Promise<MediaInfo>;
  delete(mediaId: string): Promise<{ success: boolean }>;
  getUrl(mediaId: string): Promise<string>;
}

// Upload progress callback
export interface UploadProgressCallback {
  (progress: {
    loaded: number;
    total: number;
    percentage: number;
    fileName: string;
  }): void;
}

// Media processing options
export interface MediaProcessingOptions {
  resize?: {
    width?: number;
    height?: number;
    quality?: number;
  };
  compress?: {
    quality: number; // 0-100
    format?: 'jpeg' | 'png' | 'webp';
  };
  watermark?: {
    text?: string;
    image?: Buffer;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity?: number;
  };
}

// Media metadata
export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number; // For video/audio files
  bitrate?: number;
  codec?: string;
  frameRate?: number; // For video files
  channels?: number; // For audio files
  sampleRate?: number; // For audio files
  orientation?: number; // EXIF orientation
  exif?: Record<string, unknown>;
  custom?: Record<string, unknown>;
}

// Media search/filter options
export interface MediaSearchOptions {
  query?: string;
  type?: MediaType;
  storageProvider?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sizeMin?: number;
  sizeMax?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'uploadedAt' | 'fileName' | 'fileSize' | 'type';
  sortOrder?: 'asc' | 'desc';
}

// Media batch operations
export interface BatchUploadOptions {
  files: UploadMediaParams[];
  onProgress?: UploadProgressCallback;
  onError?: (error: Error, fileName: string) => void;
  onSuccess?: (mediaInfo: MediaInfo, fileName: string) => void;
  parallel?: boolean;
  maxConcurrent?: number;
}

// Storage provider statistics
export interface StorageStats {
  provider: string;
  totalFiles: number;
  totalSize: number;
  fileTypes: Record<MediaType, number>;
  uploadsToday: number;
  uploadsThisMonth: number;
  errorsToday: number;
  lastUpload?: Date;
}

// Health check result
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  primaryStorage: {
    provider: string;
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    error?: string;
  };
  fallbackStorage?: {
    provider: string;
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    error?: string;
  };
  validation: {
    status: 'healthy' | 'unhealthy';
    error?: string;
  };
  timestamp: Date;
}
