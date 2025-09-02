import type { JobPayload, ValidationResult, TemplateMessageData } from './types';

// Validation configuration
export interface ValidationConfig {
  maxPhoneNumberLength: number;
  minPhoneNumberLength: number;
  maxTemplateNameLength: number;
  maxParamsCount: number;
  maxButtonParamsCount: number;
  maxImageUrlLength: number;
  maxDocumentUrlLength: number;
  maxFilenameLength: number;
  allowedImageExtensions: string[];
  allowedDocumentExtensions: string[];
  maxFileSize: number; // in bytes
}

// Default validation configuration
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  maxPhoneNumberLength: 20,
  minPhoneNumberLength: 10,
  maxTemplateNameLength: 100,
  maxParamsCount: 10,
  maxButtonParamsCount: 3,
  maxImageUrlLength: 2048,
  maxDocumentUrlLength: 2048,
  maxFilenameLength: 255,
  allowedImageExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  allowedDocumentExtensions: ['.pdf', '.doc', '.docx', '.txt', '.csv', '.xlsx', '.xls'],
  maxFileSize: 16 * 1024 * 1024, // 16MB
};

// Phone number validation
export function validatePhoneNumber(phoneNumber: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!phoneNumber) {
    errors.push('Phone number is required');
    return { isValid: false, errors, warnings };
  }

  // Remove any non-digit characters except + and -
  const cleaned = phoneNumber.replace(/[^\d+\-]/g, '');
  
  if (cleaned.length < DEFAULT_VALIDATION_CONFIG.minPhoneNumberLength) {
    errors.push(`Phone number must be at least ${DEFAULT_VALIDATION_CONFIG.minPhoneNumberLength} digits`);
  }

  if (cleaned.length > DEFAULT_VALIDATION_CONFIG.maxPhoneNumberLength) {
    errors.push(`Phone number must not exceed ${DEFAULT_VALIDATION_CONFIG.maxPhoneNumberLength} characters`);
  }

  // Check for valid international format
  if (!cleaned.startsWith('+') && !cleaned.startsWith('1') && !cleaned.startsWith('91')) {
    warnings.push('Phone number should be in international format (e.g., +1234567890)');
  }

  // Check for consecutive digits (at least 7 digits)
  const digitCount = cleaned.replace(/\D/g, '').length;
  if (digitCount < 7) {
    errors.push('Phone number must contain at least 7 digits');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Template name validation
export function validateTemplateName(templateName: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!templateName) {
    errors.push('Template name is required');
    return { isValid: false, errors, warnings };
  }

  if (templateName.length > DEFAULT_VALIDATION_CONFIG.maxTemplateNameLength) {
    errors.push(`Template name must not exceed ${DEFAULT_VALIDATION_CONFIG.maxTemplateNameLength} characters`);
  }

  // Check for valid template name format (alphanumeric, hyphens, underscores)
  if (!/^[a-zA-Z0-9_-]+$/.test(templateName)) {
    errors.push('Template name can only contain letters, numbers, hyphens, and underscores');
  }

  // Check for reserved words
  const reservedWords = ['admin', 'system', 'test', 'temp', 'tmp'];
  if (reservedWords.includes(templateName.toLowerCase())) {
    warnings.push('Template name should not use reserved words');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Parameters validation
export function validateParams(params?: string[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!params) {
    return { isValid: true, errors, warnings };
  }

  if (!Array.isArray(params)) {
    errors.push('Parameters must be an array');
    return { isValid: false, errors, warnings };
  }

  if (params.length > DEFAULT_VALIDATION_CONFIG.maxParamsCount) {
    errors.push(`Maximum ${DEFAULT_VALIDATION_CONFIG.maxParamsCount} parameters allowed`);
  }

  // Validate each parameter
  params.forEach((param, index) => {
    if (typeof param !== 'string') {
      errors.push(`Parameter at index ${index} must be a string`);
    } else if (param.length > 1000) {
      errors.push(`Parameter at index ${index} must not exceed 1000 characters`);
    } else if (param.trim() === '') {
      warnings.push(`Parameter at index ${index} is empty`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Button parameters validation
export function validateButtonParams(buttonParams?: string[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!buttonParams) {
    return { isValid: true, errors, warnings };
  }

  if (!Array.isArray(buttonParams)) {
    errors.push('Button parameters must be an array');
    return { isValid: false, errors, warnings };
  }

  if (buttonParams.length > DEFAULT_VALIDATION_CONFIG.maxButtonParamsCount) {
    errors.push(`Maximum ${DEFAULT_VALIDATION_CONFIG.maxButtonParamsCount} button parameters allowed`);
  }

  // Validate each button parameter
  buttonParams.forEach((param, index) => {
    if (typeof param !== 'string') {
      errors.push(`Button parameter at index ${index} must be a string`);
    } else if (param.length > 100) {
      errors.push(`Button parameter at index ${index} must not exceed 100 characters`);
    } else if (param.trim() === '') {
      warnings.push(`Button parameter at index ${index} is empty`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// URL validation
export function validateUrl(url: string, type: 'image' | 'document'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!url) {
    return { isValid: true, errors, warnings };
  }

  if (typeof url !== 'string') {
    errors.push(`${type} URL must be a string`);
    return { isValid: false, errors, warnings };
  }

  const maxLength = type === 'image' 
    ? DEFAULT_VALIDATION_CONFIG.maxImageUrlLength 
    : DEFAULT_VALIDATION_CONFIG.maxDocumentUrlLength;

  if (url.length > maxLength) {
    errors.push(`${type} URL must not exceed ${maxLength} characters`);
  }

  try {
    const urlObj = new URL(url);
    
    // Check for valid protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      errors.push(`${type} URL must use HTTP or HTTPS protocol`);
    }

    // Check for valid hostname
    if (!urlObj.hostname) {
      errors.push(`${type} URL must have a valid hostname`);
    }

    // Check file extension
    const pathname = urlObj.pathname.toLowerCase();
    const allowedExtensions = type === 'image' 
      ? DEFAULT_VALIDATION_CONFIG.allowedImageExtensions 
      : DEFAULT_VALIDATION_CONFIG.allowedDocumentExtensions;

    const hasValidExtension = allowedExtensions.some(ext => pathname.endsWith(ext));
    if (!hasValidExtension) {
      warnings.push(`${type} URL should have a valid file extension: ${allowedExtensions.join(', ')}`);
    }

  } catch {
    errors.push(`${type} URL is not valid`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Filename validation
export function validateFilename(filename?: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!filename) {
    return { isValid: true, errors, warnings };
  }

  if (typeof filename !== 'string') {
    errors.push('Filename must be a string');
    return { isValid: false, errors, warnings };
  }

  if (filename.length > DEFAULT_VALIDATION_CONFIG.maxFilenameLength) {
    errors.push(`Filename must not exceed ${DEFAULT_VALIDATION_CONFIG.maxFilenameLength} characters`);
  }

  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(filename)) {
    errors.push('Filename contains invalid characters');
  }

  // Check for reserved names
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  if (reservedNames.includes(filename.toUpperCase())) {
    errors.push('Filename is a reserved system name');
  }

  // Check for file extension
  if (!filename.includes('.')) {
    warnings.push('Filename should include a file extension');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Priority validation
export function validatePriority(priority?: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!priority) {
    return { isValid: true, errors, warnings };
  }

  const validPriorities: JobPayload['priority'][] = ['low', 'normal', 'high'];
  if (!validPriorities.includes(priority as JobPayload['priority'])) {
    errors.push(`Priority must be one of: ${validPriorities.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Retry count validation
export function validateRetryCount(retryCount?: number, maxRetries?: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (retryCount === undefined) {
    return { isValid: true, errors, warnings };
  }

  if (typeof retryCount !== 'number') {
    errors.push('Retry count must be a number');
    return { isValid: false, errors, warnings };
  }

  if (retryCount < 0) {
    errors.push('Retry count must be non-negative');
  }

  if (maxRetries !== undefined && retryCount > maxRetries) {
    errors.push(`Retry count (${retryCount}) exceeds maximum retries (${maxRetries})`);
  }

  if (retryCount > 10) {
    warnings.push('High retry count may indicate persistent issues');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Date validation
export function validateDate(fieldName: string, dateString?: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!dateString) {
    return { isValid: true, errors, warnings };
  }

  if (typeof dateString !== 'string') {
    errors.push(`${fieldName} must be a string`);
    return { isValid: false, errors, warnings };
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    errors.push(`${fieldName} must be a valid date string`);
  } else {
    const now = new Date();
    if (fieldName === 'scheduledAt' && date < now) {
      warnings.push('Scheduled date is in the past');
    }
    if (fieldName === 'expiresAt' && date <= now) {
      errors.push('Expiration date must be in the future');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Complete job payload validation
export function validateJobPayload(payload: JobPayload): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required fields
  if (!payload.templateName) {
    errors.push('Template name is required');
  } else {
    const templateResult = validateTemplateName(payload.templateName);
    errors.push(...templateResult.errors);
    warnings.push(...templateResult.warnings);
  }

  // Validate contact ID or phone number (at least one is required)
  if (!payload.contactId && !payload.phoneNumber) {
    errors.push('Either contactId or phoneNumber is required');
  }

  // Validate phone number if provided
  if (payload.phoneNumber) {
    const phoneResult = validatePhoneNumber(payload.phoneNumber);
    errors.push(...phoneResult.errors);
    warnings.push(...phoneResult.warnings);
  }

  // Validate parameters
  const paramsResult = validateParams(payload.params);
  errors.push(...paramsResult.errors);
  warnings.push(...paramsResult.warnings);

  // Validate button parameters
  const buttonParamsResult = validateButtonParams(payload.buttonParams);
  errors.push(...buttonParamsResult.errors);
  warnings.push(...buttonParamsResult.warnings);

  // Validate image URL
  const imageUrlResult = validateUrl(payload.imageUrl || '', 'image');
  errors.push(...imageUrlResult.errors);
  warnings.push(...imageUrlResult.warnings);

  // Validate document URL
  const documentUrlResult = validateUrl(payload.documentUrl || '', 'document');
  errors.push(...documentUrlResult.errors);
  warnings.push(...documentUrlResult.warnings);

  // Validate filename
  const filenameResult = validateFilename(payload.filename);
  errors.push(...filenameResult.errors);
  warnings.push(...filenameResult.warnings);

  // Validate priority
  const priorityResult = validatePriority(payload.priority);
  errors.push(...priorityResult.errors);
  warnings.push(...priorityResult.warnings);

  // Validate retry count
  const retryResult = validateRetryCount(payload.retryCount, payload.maxRetries);
  errors.push(...retryResult.errors);
  warnings.push(...retryResult.warnings);

  // Validate dates
  const scheduledResult = validateDate('scheduledAt', payload.scheduledAt);
  errors.push(...scheduledResult.errors);
  warnings.push(...scheduledResult.warnings);

  const expiresResult = validateDate('expiresAt', payload.expiresAt);
  errors.push(...expiresResult.errors);
  warnings.push(...expiresResult.warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Template message data validation
export function validateTemplateMessageData(data: TemplateMessageData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate phone number
  const phoneResult = validatePhoneNumber(data.to);
  errors.push(...phoneResult.errors);
  warnings.push(...phoneResult.warnings);

  // Validate template name
  const templateResult = validateTemplateName(data.templateName);
  errors.push(...templateResult.errors);
  warnings.push(...templateResult.warnings);

  // Validate body parameters
  const paramsResult = validateParams(data.bodyParams);
  errors.push(...paramsResult.errors);
  warnings.push(...paramsResult.warnings);

  // Validate button parameters
  const buttonParamsResult = validateButtonParams(data.buttonParams);
  errors.push(...buttonParamsResult.errors);
  warnings.push(...buttonParamsResult.warnings);

  // Validate image URL
  const imageUrlResult = validateUrl(data.imageUrl || '', 'image');
  errors.push(...imageUrlResult.errors);
  warnings.push(...imageUrlResult.warnings);

  // Validate document URL
  const documentUrlResult = validateUrl(data.documentUrl || '', 'document');
  errors.push(...documentUrlResult.errors);
  warnings.push(...documentUrlResult.warnings);

  // Validate filename
  const filenameResult = validateFilename(data.filename);
  errors.push(...filenameResult.errors);
  warnings.push(...filenameResult.warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// JSON validation
export function validateJsonString(jsonString: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof jsonString !== 'string') {
    errors.push('Input must be a string');
    return { isValid: false, errors, warnings };
  }

  if (jsonString.trim() === '') {
    errors.push('JSON string cannot be empty');
    return { isValid: false, errors, warnings };
  }

  try {
    const parsed = JSON.parse(jsonString);
    
    if (typeof parsed !== 'object' || parsed === null) {
      errors.push('JSON must be an object');
    }
  } catch (error) {
    errors.push(`Invalid JSON format: ${(error as Error).message}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Utility function to sanitize job payload
export function sanitizeJobPayload(payload: JobPayload): JobPayload {
  return {
    ...payload,
    templateName: payload.templateName?.trim(),
    phoneNumber: payload.phoneNumber?.trim(),
    contactId: payload.contactId?.trim(),
    params: payload.params?.map(param => param?.trim()).filter(Boolean),
    buttonParams: payload.buttonParams?.map(param => param?.trim()).filter(Boolean),
    imageUrl: payload.imageUrl?.trim(),
    documentUrl: payload.documentUrl?.trim(),
    filename: payload.filename?.trim(),
  };
}
