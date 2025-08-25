// Validation for Media Manager
// File validation, type checking, and content validation

import { MediaType } from './types.js';
import { logger } from './logger.js';

export interface FileValidationConfig {
  maxFileSize: number;
  allowedImageTypes: string[];
  allowedVideoTypes: string[];
  allowedAudioTypes: string[];
  allowedDocumentTypes: string[];
  maxImageSize: number;
  maxVideoSize: number;
  maxAudioSize: number;
  maxDocumentSize: number;
  enableContentValidation: boolean;
  enableVirusScan: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileType: MediaType;
  detectedMimeType?: string;
  actualFileSize: number;
  estimatedDuration?: number; // For audio/video files
}

export interface FileInfo {
  fileName: string;
  mimeType: string;
  fileSize: number;
  buffer: Buffer;
}

/**
 * Default validation configuration
 */
export const DEFAULT_VALIDATION_CONFIG: FileValidationConfig = {
  maxFileSize: 16 * 1024 * 1024, // 16MB
  allowedImageTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
  ],
  allowedVideoTypes: [
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/flv',
    'video/webm',
    'video/3gpp',
    'video/3gpp2',
  ],
  allowedAudioTypes: [
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/m4a',
    'audio/flac',
    'audio/3gpp',
    'audio/3gpp2',
  ],
  allowedDocumentTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ],
  maxImageSize: 5 * 1024 * 1024, // 5MB
  maxVideoSize: 16 * 1024 * 1024, // 16MB
  maxAudioSize: 16 * 1024 * 1024, // 16MB
  maxDocumentSize: 100 * 1024 * 1024, // 100MB
  enableContentValidation: true,
  enableVirusScan: false,
};

/**
 * Media type detection from MIME type
 */
export function detectMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }
  if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) {
    return 'document';
  }
  return 'document'; // Default fallback
}

/**
 * Get allowed types for a specific media type
 */
export function getAllowedTypesForMediaType(
  mediaType: MediaType,
  config: FileValidationConfig
): string[] {
  switch (mediaType) {
    case 'image':
      return config.allowedImageTypes;
    case 'video':
      return config.allowedVideoTypes;
    case 'audio':
      return config.allowedAudioTypes;
    case 'document':
      return config.allowedDocumentTypes;
    default:
      return [];
  }
}

/**
 * Get maximum file size for a specific media type
 */
export function getMaxFileSizeForMediaType(
  mediaType: MediaType,
  config: FileValidationConfig
): number {
  switch (mediaType) {
    case 'image':
      return config.maxImageSize;
    case 'video':
      return config.maxVideoSize;
    case 'audio':
      return config.maxAudioSize;
    case 'document':
      return config.maxDocumentSize;
    default:
      return config.maxFileSize;
  }
}

/**
 * Validate file size
 */
export function validateFileSize(
  fileSize: number,
  maxSize: number,
  fileName: string
): { isValid: boolean; error?: string } {
  logger.logFileSizeCheck(fileName, fileSize, maxSize, fileSize <= maxSize);

  if (fileSize > maxSize) {
    const error = `File "${fileName}" exceeds maximum size of ${formatFileSize(maxSize)}`;
    return { isValid: false, error };
  }

  return { isValid: true };
}

/**
 * Validate file type
 */
export function validateFileType(
  mimeType: string,
  allowedTypes: string[],
  fileName: string
): { isValid: boolean; error?: string } {
  logger.logFileTypeCheck(fileName, mimeType, allowedTypes, allowedTypes.includes(mimeType));

  if (!allowedTypes.includes(mimeType)) {
    const error = `File type "${mimeType}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`;
    return { isValid: false, error };
  }

  return { isValid: true };
}

/**
 * Validate file name
 */
export function validateFileName(fileName: string): { isValid: boolean; error?: string } {
  // Check for empty or invalid file names
  if (!fileName || fileName.trim().length === 0) {
    return { isValid: false, error: 'File name cannot be empty' };
  }

  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(fileName)) {
    return { isValid: false, error: 'File name contains invalid characters' };
  }

  // Check for reserved names (Windows)
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  const parts = fileName.split('.');
  const fileNameWithoutExt = parts[0]?.toUpperCase() || '';
  if (reservedNames.includes(fileNameWithoutExt)) {
    return { isValid: false, error: 'File name is a reserved system name' };
  }

  // Check length
  if (fileName.length > 255) {
    return { isValid: false, error: 'File name is too long (max 255 characters)' };
  }

  return { isValid: true };
}

/**
 * Detect MIME type from file buffer (basic implementation)
 */
export function detectMimeTypeFromBuffer(buffer: Buffer): string {
  // Basic MIME type detection from file signatures
  const signatures: Record<string, number[]> = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/gif': [0x47, 0x49, 0x46],
    'image/webp': [0x52, 0x49, 0x46, 0x46],
    'application/pdf': [0x25, 0x50, 0x44, 0x46],
    'video/mp4': [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70],
    'audio/mp3': [0x49, 0x44, 0x33],
  };

  for (const [mimeType, signature] of Object.entries(signatures)) {
    if (buffer.length >= signature.length) {
      const matches = signature.every((byte, index) => buffer[index] === byte);
      if (matches) {
        return mimeType;
      }
    }
  }

  // Default to application/octet-stream if no signature matches
  return 'application/octet-stream';
}

/**
 * Validate file content (basic implementation)
 */
export function validateFileContent(
  buffer: Buffer,
  mimeType: string,
  config: FileValidationConfig
): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (!config.enableContentValidation) {
    return { isValid: true, warnings };
  }

  // Basic content validation based on MIME type
  if (mimeType.startsWith('image/')) {
    // Check if image buffer has minimum size
    if (buffer.length < 100) {
      warnings.push('Image file appears to be too small, may be corrupted');
    }
  }

  if (mimeType.startsWith('video/')) {
    // Check if video buffer has minimum size
    if (buffer.length < 1024) {
      warnings.push('Video file appears to be too small, may be corrupted');
    }
  }

  if (mimeType.startsWith('audio/')) {
    // Check if audio buffer has minimum size
    if (buffer.length < 512) {
      warnings.push('Audio file appears to be too small, may be corrupted');
    }
  }

  if (mimeType === 'application/pdf') {
    // Check PDF signature
    const pdfSignature = [0x25, 0x50, 0x44, 0x46];
    if (buffer.length < 4 || !pdfSignature.every((byte, index) => buffer[index] === byte)) {
      warnings.push('PDF file signature validation failed');
    }
  }

  return { isValid: true, warnings };
}

/**
 * Comprehensive file validation
 */
export function validateFile(
  fileInfo: FileInfo,
  config: FileValidationConfig = DEFAULT_VALIDATION_CONFIG
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate file name
  const fileNameValidation = validateFileName(fileInfo.fileName);
  if (!fileNameValidation.isValid) {
    errors.push(fileNameValidation.error!);
  }

  // Detect media type
  const mediaType = detectMediaType(fileInfo.mimeType);
  const allowedTypes = getAllowedTypesForMediaType(mediaType, config);
  const maxSize = getMaxFileSizeForMediaType(mediaType, config);

  // Validate file size
  const sizeValidation = validateFileSize(fileInfo.fileSize, maxSize, fileInfo.fileName);
  if (!sizeValidation.isValid) {
    errors.push(sizeValidation.error!);
  }

  // Validate file type
  const typeValidation = validateFileType(fileInfo.mimeType, allowedTypes, fileInfo.fileName);
  if (!typeValidation.isValid) {
    errors.push(typeValidation.error!);
  }

  // Detect MIME type from buffer and compare
  const detectedMimeType = detectMimeTypeFromBuffer(fileInfo.buffer);
  if (detectedMimeType !== fileInfo.mimeType && detectedMimeType !== 'application/octet-stream') {
    warnings.push(`Declared MIME type (${fileInfo.mimeType}) differs from detected type (${detectedMimeType})`);
  }

  // Validate file content
  const contentValidation = validateFileContent(fileInfo.buffer, fileInfo.mimeType, config);
  warnings.push(...contentValidation.warnings);

  // Log validation result
  logger.logFileValidation(
    fileInfo.fileName,
    fileInfo.mimeType,
    fileInfo.fileSize,
    errors.length === 0,
    errors,
    warnings
  );

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fileType: mediaType,
    detectedMimeType,
    actualFileSize: fileInfo.fileSize,
  };
}

/**
 * Format file size for human reading
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Get file extension from file name
 */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1]?.toLowerCase() || '' : '';
}

/**
 * Generate safe file name
 */
export function generateSafeFileName(originalName: string, prefix?: string): string {
  // Remove invalid characters
  let safeName = originalName.replace(/[<>:"/\\|?*]/g, '_');
  
  // Replace spaces with underscores
  safeName = safeName.replace(/\s+/g, '_');
  
  // Remove multiple consecutive underscores
  safeName = safeName.replace(/_+/g, '_');
  
  // Remove leading/trailing underscores
  safeName = safeName.replace(/^_+|_+$/g, '');
  
  // Add prefix if provided
  if (prefix) {
    safeName = `${prefix}_${safeName}`;
  }
  
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now();
  const extension = getFileExtension(originalName);
  const nameWithoutExt = safeName.replace(new RegExp(`\\.${extension}$`), '');
  
  return extension ? `${nameWithoutExt}_${timestamp}.${extension}` : `${safeName}_${timestamp}`;
}
