import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// WhatsApp media size limits (in bytes)
export const WHATSAPP_MEDIA_LIMITS = {
  image: 5 * 1024 * 1024,      // 5MB
  video: 16 * 1024 * 1024,     // 16MB
  audio: 16 * 1024 * 1024,     // 16MB
  document: 100 * 1024 * 1024, // 100MB
} as const;

export type MediaType = keyof typeof WHATSAPP_MEDIA_LIMITS;

// File validation utilities
export function validateFileSize(file: File, mediaType: MediaType): { valid: boolean; error?: string } {
  const maxSize = WHATSAPP_MEDIA_LIMITS[mediaType];
  const fileSize = file.size;
  
  if (fileSize > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(1);
    
    return {
      valid: false,
      error: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} files cannot exceed ${maxSizeMB}MB. Your file is ${fileSizeMB}MB.`
    };
  }
  
  return { valid: true };
}

export function validateFileType(file: File, mediaType: MediaType): { valid: boolean; error?: string } {
  const mimeType = file.type.toLowerCase();
  
  switch (mediaType) {
    case 'image':
      if (!mimeType.startsWith('image/')) {
        return { valid: false, error: 'Please select an image file.' };
      }
      break;
    case 'video':
      if (!mimeType.startsWith('video/')) {
        return { valid: false, error: 'Please select a video file.' };
      }
      break;
    case 'audio':
      if (!mimeType.startsWith('audio/')) {
        return { valid: false, error: 'Please select an audio file.' };
      }
      break;
    case 'document':
      // Documents can be various types, so we'll be more permissive
      if (mimeType.startsWith('image/') || mimeType.startsWith('video/') || mimeType.startsWith('audio/')) {
        return { valid: false, error: 'Please select a document file, not media.' };
      }
      break;
  }
  
  return { valid: true };
}

export function validateFile(file: File, mediaType: MediaType): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check file size
  const sizeValidation = validateFileSize(file, mediaType);
  if (!sizeValidation.valid) {
    errors.push(sizeValidation.error!);
  }
  
  // Check file type
  const typeValidation = validateFileType(file, mediaType);
  if (!typeValidation.valid) {
    errors.push(typeValidation.error!);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
