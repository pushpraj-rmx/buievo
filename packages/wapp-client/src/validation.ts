// WhatsApp Client Validation
// Input validation for WhatsApp Business API requests

import { WhatsAppValidationError } from './errors';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Phone number validation
export function validatePhoneNumber(phoneNumber: string): ValidationResult {
  const errors: string[] = [];
  
  if (!phoneNumber) {
    errors.push('Phone number is required');
    return { isValid: false, errors };
  }
  
  // Remove any non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Check if it starts with + and has country code
  if (!cleaned.startsWith('+')) {
    errors.push('Phone number must start with + and include country code');
  }
  
  // Check length (country code + number, typically 7-15 digits)
  if (cleaned.length < 8 || cleaned.length > 15) {
    errors.push('Phone number must be between 8 and 15 digits including country code');
  }
  
  // Check if it contains only valid characters
  if (!/^\+[1-9]\d{1,14}$/.test(cleaned)) {
    errors.push('Phone number format is invalid');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Text message validation
export function validateTextMessage(text: string): ValidationResult {
  const errors: string[] = [];
  
  if (!text) {
    errors.push('Message text is required');
    return { isValid: false, errors };
  }
  
  if (text.length > 4096) {
    errors.push('Message text must be 4096 characters or less');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Template name validation
export function validateTemplateName(templateName: string): ValidationResult {
  const errors: string[] = [];
  
  if (!templateName) {
    errors.push('Template name is required');
    return { isValid: false, errors };
  }
  
  if (templateName.length > 512) {
    errors.push('Template name must be 512 characters or less');
  }
  
  // Check for valid characters (alphanumeric, underscore, hyphen)
  if (!/^[a-zA-Z0-9_-]+$/.test(templateName)) {
    errors.push('Template name can only contain letters, numbers, underscores, and hyphens');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// URL validation
export function validateUrl(url: string, fieldName: string): ValidationResult {
  const errors: string[] = [];
  
  if (!url) {
    errors.push(`${fieldName} URL is required`);
    return { isValid: false, errors };
  }
  
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      errors.push(`${fieldName} URL must use HTTP or HTTPS protocol`);
    }
  } catch {
    errors.push(`${fieldName} URL is invalid`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Template parameters validation
export function validateTemplateParameters(
  bodyParams: string[] = [],
  buttonParams: string[] = []
): ValidationResult {
  const errors: string[] = [];
  
  // Validate body parameters
  bodyParams.forEach((param, index) => {
    if (param.length > 1024) {
      errors.push(`Body parameter ${index + 1} must be 1024 characters or less`);
    }
  });
  
  // Validate button parameters
  buttonParams.forEach((param, index) => {
    if (param.length > 1024) {
      errors.push(`Button parameter ${index + 1} must be 1024 characters or less`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Comprehensive validation for text message arguments
export function validateTextMessageArgs(args: {
  to: string;
  text: string;
}): void {
  const phoneValidation = validatePhoneNumber(args.to);
  const textValidation = validateTextMessage(args.text);
  
  const allErrors = [
    ...phoneValidation.errors.map(err => `Phone number: ${err}`),
    ...textValidation.errors.map(err => `Text: ${err}`),
  ];
  
  if (allErrors.length > 0) {
    throw new WhatsAppValidationError(
      'Text message validation failed',
      { errors: allErrors }
    );
  }
}

// Comprehensive validation for template message arguments
export function validateTemplateMessageArgs(args: {
  to: string;
  templateName: string;
  bodyParams?: string[];
  buttonParams?: string[];
  imageUrl?: string;
  documentUrl?: string;
  filename?: string;
}): void {
  const errors: string[] = [];
  
  // Validate phone number
  const phoneValidation = validatePhoneNumber(args.to);
  errors.push(...phoneValidation.errors.map(err => `Phone number: ${err}`));
  
  // Validate template name
  const templateValidation = validateTemplateName(args.templateName);
  errors.push(...templateValidation.errors.map(err => `Template name: ${err}`));
  
  // Validate parameters
  const paramsValidation = validateTemplateParameters(
    args.bodyParams || [],
    args.buttonParams || []
  );
  errors.push(...paramsValidation.errors);
  
  // Validate image URL if provided
  if (args.imageUrl) {
    const imageValidation = validateUrl(args.imageUrl, 'Image');
    errors.push(...imageValidation.errors.map(err => `Image: ${err}`));
  }
  
  // Validate document URL if provided
  if (args.documentUrl) {
    const documentValidation = validateUrl(args.documentUrl, 'Document');
    errors.push(...documentValidation.errors.map(err => `Document: ${err}`));
  }
  
  // Validate filename if provided
  if (args.filename) {
    if (args.filename.length > 240) {
      errors.push('Filename must be 240 characters or less');
    }
    
    if (!/^[a-zA-Z0-9._-]+$/.test(args.filename)) {
      errors.push('Filename can only contain letters, numbers, dots, underscores, and hyphens');
    }
  }
  
  if (errors.length > 0) {
    throw new WhatsAppValidationError(
      'Template message validation failed',
      { errors }
    );
  }
}

// Utility function to validate any input
export function validateInput<T>(
  value: T,
  validator: (value: T) => ValidationResult,
  fieldName: string
): void {
  const result = validator(value);
  if (!result.isValid) {
    throw new WhatsAppValidationError(
      `${fieldName} validation failed`,
      { errors: result.errors }
    );
  }
}
