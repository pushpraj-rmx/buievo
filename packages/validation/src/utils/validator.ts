// Validation utilities for buievo

import { z } from "zod";
import type { 
  ValidationResultUtil as ValidationResult, 
  ValidationErrorUtil as ValidationError, 
  ValidationWarningUtil as ValidationWarning 
} from "@buievo/types";

// Validation result builder
export class ValidationResultBuilder {
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];

  addError(field: string, message: string, code: string, value?: unknown): this {
    this.errors.push({ field, message, code, value });
    return this;
  }

  addWarning(field: string, message: string, code: string, value?: unknown): this {
    this.warnings.push({ field, message, code, value });
    return this;
  }

  addErrors(errors: ValidationError[]): this {
    this.errors.push(...errors);
    return this;
  }

  addWarnings(warnings: ValidationWarning[]): this {
    this.warnings.push(...warnings);
    return this;
  }

  build(): ValidationResult {
    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  static create(): ValidationResultBuilder {
    return new ValidationResultBuilder();
  }
}

// Generic validation function
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
        value: (err as { received: unknown }).received,
      }));
      return { success: false, errors };
    }
    return {
      success: false,
      errors: [{
        field: context || 'unknown',
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        value: data,
      }],
    };
  }
}

// Safe validation function (doesn't throw)
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  return validateWithSchema(schema, data);
}

// Partial validation function
export function validatePartial<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  partial: boolean = true
): { success: true; data: Partial<T> } | { success: false; errors: ValidationError[] } {
  try {
    const partialSchema = partial ? (schema as any).partial() : schema; // eslint-disable-line @typescript-eslint/no-explicit-any
    const result = partialSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
        value: (err as { received: unknown }).received,
      }));
      return { success: false, errors };
    }
    return {
      success: false,
      errors: [{
        field: 'unknown',
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        value: data,
      }],
    };
  }
}

// Async validation function
export async function validateAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: ValidationError[] }> {
  try {
    const result = await schema.parseAsync(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
        value: (err as { received: unknown }).received,
      }));
      return { success: false, errors };
    }
    return {
      success: false,
      errors: [{
        field: 'unknown',
        message: 'Async validation failed',
        code: 'VALIDATION_ERROR',
        value: data,
      }],
    };
  }
}

// Validation with custom error messages
export function validateWithMessages<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  messages: Record<string, string> = {}
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => {
        const field = err.path.join('.');
        const customMessage = messages[field] || messages[err.code] || err.message;
        return {
          field,
          message: customMessage,
          code: err.code,
          value: (err as { received: unknown }).received,
        };
      });
      return { success: false, errors };
    }
    return {
      success: false,
      errors: [{
        field: 'unknown',
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        value: data,
      }],
    };
  }
}

// Validation with transformation
export function validateAndTransform<T, R>(
  schema: z.ZodSchema<T>,
  data: unknown,
  transform: (data: T) => R
): { success: true; data: R } | { success: false; errors: ValidationError[] } {
  const validation = validateWithSchema(schema, data);
  if (validation.success) {
    return { success: true, data: transform(validation.data) };
  }
  return validation;
}

// Batch validation
export function validateBatch<T>(
  schema: z.ZodSchema<T>,
  items: unknown[]
): {
  valid: T[];
  invalid: Array<{ index: number; errors: ValidationError[] }>;
} {
  const valid: T[] = [];
  const invalid: Array<{ index: number; errors: ValidationError[] }> = [];

  items.forEach((item, index) => {
    const result = validateWithSchema(schema, item);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push({ index, errors: result.errors });
    }
  });

  return { valid, invalid };
}

// Validation with context
export function validateWithContext<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: Record<string, unknown>
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  try {
    // Create a context-aware schema
    const contextSchema = schema.superRefine((val, ctx) => {
      // Add context to validation context
      Object.assign(ctx, { context });
    });
    
    const result = contextSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
        value: (err as { received: unknown }).received,
      }));
      return { success: false, errors };
    }
    return {
      success: false,
      errors: [{
        field: 'unknown',
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        value: data,
      }],
    };
  }
}

// Validation with custom rules
export function validateWithRules<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  rules: Array<(data: T) => ValidationError[]>
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  const validation = validateWithSchema(schema, data);
  if (!validation.success) {
    return validation;
  }

  const customErrors: ValidationError[] = [];
  rules.forEach(rule => {
    const ruleErrors = rule(validation.data);
    customErrors.push(...ruleErrors);
  });

  if (customErrors.length > 0) {
    return { success: false, errors: customErrors };
  }

  return validation;
}

// Validation with warnings
export function validateWithWarnings<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  warningRules: Array<(data: T) => ValidationWarning[]>
): {
  success: boolean;
  data?: T;
  errors: ValidationError[];
  warnings: ValidationWarning[];
} {
  const validation = validateWithSchema(schema, data);
  const warnings: ValidationWarning[] = [];

  if (validation.success) {
    warningRules.forEach(rule => {
      const ruleWarnings = rule(validation.data);
      warnings.push(...ruleWarnings);
    });

    return {
      success: true,
      data: validation.data,
      errors: [],
      warnings,
    };
  }

  return {
    success: false,
    errors: validation.errors,
    warnings,
  };
}

// Validation result formatter
export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map(error => `${error.field}: ${error.message}`).join(', ');
}

export function formatValidationWarnings(warnings: ValidationWarning[]): string {
  return warnings.map(warning => `${warning.field}: ${warning.message}`).join(', ');
}

// Validation result to HTTP response
export function validationResultToResponse(
  result: ValidationResult,
  statusCode: number = 400
): { statusCode: number; body: unknown } {
  return {
    statusCode,
    body: {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: {
          errors: result.errors,
          warnings: result.warnings,
        },
      },
    },
  };
}

// Export utility functions
export {
  ValidationResultBuilder as Builder,
  validateWithSchema as validate,
};
