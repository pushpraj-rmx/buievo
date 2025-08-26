import { z } from 'zod';
import type { FormField, ValidationRule, FormState } from './types';

// Base validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format');
export const urlSchema = z.string().url('Invalid URL format');

// User validation schemas
export const userSchema = z.object({
  id: z.string().optional(),
  email: emailSchema,
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  role: z.enum(['admin', 'user', 'viewer']),
  avatar: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

export const userUpdateSchema = userSchema.partial().omit({ id: true });

// Navigation validation schemas
export const navigationItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  href: z.string().min(1, 'URL is required'),
  icon: z.string().optional(),
  badge: z.union([z.string(), z.number()]).optional(),
  isActive: z.boolean().optional(),
  isDisabled: z.boolean().optional(),
  requiresPermission: z.string().optional(),
});

// Form validation schemas
export const formFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  label: z.string().min(1, 'Field label is required'),
  type: z.enum(['text', 'email', 'password', 'number', 'select', 'textarea', 'checkbox', 'radio', 'file', 'date', 'time', 'datetime']),
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
  options: z.array(z.object({ label: z.string(), value: z.any() })).optional(),
  validation: z.array(z.object({
    type: z.enum(['required', 'min', 'max', 'pattern', 'email', 'url', 'custom']),
    value: z.any().optional(),
    message: z.string(),
  })).optional(),
  defaultValue: z.any().optional(),
  disabled: z.boolean().optional(),
  hidden: z.boolean().optional(),
});

// File validation schemas
export const fileValidationSchema = z.object({
  maxSize: z.number().positive('Max file size must be positive'),
  allowedTypes: z.array(z.string()).min(1, 'At least one file type must be allowed'),
  maxFiles: z.number().positive('Max files must be positive').optional(),
});

export const mediaUploadSchema = z.object({
  file: z.instanceof(File),
  type: z.enum(['image', 'video', 'audio', 'document']),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Search validation schemas
export const searchConfigSchema = z.object({
  placeholder: z.string().optional(),
  debounceMs: z.number().min(0, 'Debounce must be non-negative').max(5000, 'Debounce must be less than 5000ms'),
  minLength: z.number().min(0, 'Min length must be non-negative'),
  maxResults: z.number().min(1, 'Max results must be at least 1').max(1000, 'Max results must be less than 1000'),
});

// Theme validation schemas
export const themeSchema = z.object({
  mode: z.enum(['light', 'dark', 'system']),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Primary color must be a valid hex color'),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Accent color must be a valid hex color'),
  borderRadius: z.string().regex(/^\d+(\.\d+)?(px|rem|em|%)$/, 'Border radius must be a valid CSS value'),
  fontSize: z.string().regex(/^\d+(\.\d+)?(px|rem|em)$/, 'Font size must be a valid CSS value'),
});

// Settings validation schemas
export const notificationSettingsSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
  inApp: z.boolean(),
  sound: z.boolean(),
  desktop: z.boolean(),
  frequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']),
});

export const securitySettingsSchema = z.object({
  twoFactorEnabled: z.boolean(),
  sessionTimeout: z.number().min(300, 'Session timeout must be at least 5 minutes').max(86400, 'Session timeout must be less than 24 hours'),
  passwordPolicy: z.object({
    minLength: z.number().min(6, 'Min password length must be at least 6').max(128, 'Min password length must be less than 128'),
    requireUppercase: z.boolean(),
    requireLowercase: z.boolean(),
    requireNumbers: z.boolean(),
    requireSymbols: z.boolean(),
  }),
  ipWhitelist: z.array(z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Invalid IP address')),
});

// WhatsApp specific validation schemas
export const whatsappConfigSchema = z.object({
  phoneNumberId: z.string().min(1, 'Phone number ID is required'),
  accessToken: z.string().min(1, 'Access token is required'),
  wabaId: z.string().min(1, 'WABA ID is required'),
  webhookVerifyToken: z.string().min(1, 'Webhook verify token is required'),
  apiVersion: z.string().regex(/^\d+\.\d+$/, 'API version must be in format X.Y'),
  isEnabled: z.boolean(),
});

export const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100, 'Template name must be less than 100 characters'),
  category: z.string().min(1, 'Template category is required'),
  language: z.string().min(2, 'Language code must be at least 2 characters').max(5, 'Language code must be less than 5 characters'),
  components: z.array(z.any()).optional(),
  status: z.enum(['draft', 'pending', 'approved', 'rejected']).optional(),
});

export const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(200, 'Campaign name must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  templateId: z.string().min(1, 'Template ID is required'),
  targetAudience: z.array(z.string()).min(1, 'At least one target audience must be selected'),
  scheduledAt: z.date().optional(),
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled']).optional(),
});

// Validation functions
export function validateField(
  value: unknown,
  field: FormField
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required field
  if (field.required && (value === undefined || value === null || value === '')) {
    errors.push(`${field.label} is required`);
    return { isValid: false, errors };
  }

  // Skip validation if value is empty and not required
  if (!field.required && (value === undefined || value === null || value === '')) {
    return { isValid: true, errors: [] };
  }

  // Apply validation rules
  if (field.validation) {
    for (const rule of field.validation) {
      const validationResult = validateRule(value, rule);
      if (!validationResult.isValid && validationResult.error) {
        errors.push(validationResult.error);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateRule(
  value: unknown,
  rule: ValidationRule
): { isValid: boolean; error?: string } {
  switch (rule.type) {
    case 'required':
      if (value === undefined || value === null || value === '') {
        return { isValid: false, error: rule.message };
      }
      break;

    case 'min':
      if (typeof value === 'string' && value.length < (rule.value as number)) {
        return { isValid: false, error: rule.message };
      }
      if (typeof value === 'number' && value < (rule.value as number)) {
        return { isValid: false, error: rule.message };
      }
      break;

    case 'max':
      if (typeof value === 'string' && value.length > (rule.value as number)) {
        return { isValid: false, error: rule.message };
      }
      if (typeof value === 'number' && value > (rule.value as number)) {
        return { isValid: false, error: rule.message };
      }
      break;

    case 'pattern':
      if (typeof value === 'string' && rule.value && typeof rule.value === 'string' && !new RegExp(rule.value).test(value)) {
        return { isValid: false, error: rule.message };
      }
      break;

    case 'email':
      if (typeof value === 'string' && !emailSchema.safeParse(value).success) {
        return { isValid: false, error: rule.message };
      }
      break;

    case 'url':
      if (typeof value === 'string' && !urlSchema.safeParse(value).success) {
        return { isValid: false, error: rule.message };
      }
      break;

    case 'custom':
      // Custom validation logic would be implemented here
      break;
  }

  return { isValid: true };
}

export function validateForm(
  values: Record<string, unknown>,
  fields: FormField[]
): { isValid: boolean; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {};

  for (const field of fields) {
    const value = values[field.name];
    const validation = validateField(value, field);
    
    if (!validation.isValid) {
      errors[field.name] = validation.errors;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// File validation functions
export function validateFile(
  file: File,
  config: {
    maxSize: number;
    allowedTypes: string[];
    maxFiles?: number;
  }
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check file size
  if (file.size > config.maxSize) {
    const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    errors.push(`File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`);
  }

  // Check file type
  const fileType = file.type.toLowerCase();
  const isAllowedType = config.allowedTypes.some(allowedType => {
    if (allowedType.includes('*')) {
      const pattern = allowedType.replace('*', '.*');
      return new RegExp(pattern).test(fileType);
    }
    return fileType === allowedType.toLowerCase();
  });

  if (!isAllowedType) {
    errors.push(`File type "${file.type}" is not allowed. Allowed types: ${config.allowedTypes.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateImageFile(file: File): { isValid: boolean; errors: string[] } {
  return validateFile(file, {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  });
}

export function validateVideoFile(file: File): { isValid: boolean; errors: string[] } {
  return validateFile(file, {
    maxSize: 16 * 1024 * 1024, // 16MB
    allowedTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
  });
}

export function validateDocumentFile(file: File): { isValid: boolean; errors: string[] } {
  return validateFile(file, {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  });
}

// Schema validation helpers
export function validateWithSchema<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { isValid: boolean; data?: T; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      isValid: true,
      data: result.data,
      errors: [],
    };
  }

  return {
    isValid: false,
    errors: result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`),
  };
}

// Form state helpers
export function createFormState(fields: FormField[]): FormState {
  const values: Record<string, unknown> = {};
  const errors: Record<string, string[]> = {};
  const touched: Record<string, boolean> = {};

  for (const field of fields) {
    values[field.name] = field.defaultValue;
    errors[field.name] = [];
    touched[field.name] = false;
  }

  return {
    values,
    errors,
    touched,
    isSubmitting: false,
    isValid: false,
  };
}

export function updateFormState(
  state: FormState,
  updates: Partial<FormState>
): FormState {
  return {
    ...state,
    ...updates,
  };
}

// Utility validation functions
export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function isValidPhone(phone: string): boolean {
  return phoneSchema.safeParse(phone).success;
}

export function isValidUrl(url: string): boolean {
  return urlSchema.safeParse(url).success;
}

export function isValidPassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

export function isValidIpAddress(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// Export all schemas
export const schemas = {
  user: userSchema,
  userUpdate: userUpdateSchema,
  navigationItem: navigationItemSchema,
  formField: formFieldSchema,
  fileValidation: fileValidationSchema,
  mediaUpload: mediaUploadSchema,
  searchConfig: searchConfigSchema,
  theme: themeSchema,
  notificationSettings: notificationSettingsSchema,
  securitySettings: securitySettingsSchema,
  whatsappConfig: whatsappConfigSchema,
  template: templateSchema,
  campaign: campaignSchema,
} as const;
