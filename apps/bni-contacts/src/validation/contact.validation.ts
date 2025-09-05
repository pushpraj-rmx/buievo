import { z } from 'zod';
import { ContactCategory, ContactStatus } from '../types/contact.types';

// Validation schemas
const contactCategorySchema = z.enum(['member', 'leadership', 'prospect', 'alumni', 'guest', 'partner']);
const contactStatusSchema = z.enum(['active', 'inactive', 'pending', 'suspended']);

const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
  email: z.string().email('Invalid email format').max(100, 'Email must be less than 100 characters'),
  phone: z.string().optional().refine(
    (phone) => !phone || /^\+?[\d\s\-\(\)]+$/.test(phone),
    'Invalid phone number format'
  ),
  company: z.string().max(100, 'Company name must be less than 100 characters').optional(),
  position: z.string().max(100, 'Position must be less than 100 characters').optional(),
  category: contactCategorySchema,
  tags: z.array(z.string().max(30, 'Tag must be less than 30 characters')).optional().default([]),
  status: contactStatusSchema.optional().default('active'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

const updateContactSchema = createContactSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided for update'
);

const idSchema = z.string().min(1, 'ID is required').regex(/^\d+$/, 'ID must be a number');

const searchParamsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional().transform((val) => val ? val.split(',') : undefined),
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit must be at most 100').default(10),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit must be at most 100').default(10),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const bulkOperationSchema = z.object({
  operation: z.enum(['delete', 'update_category', 'update_status']),
  contacts: z.array(z.string().min(1, 'Contact ID is required')).min(1, 'At least one contact ID is required'),
  data: z.any().optional(),
});

export class ContactValidation {
  validateCreateContact(data: any): { success: boolean; errors?: any } {
    try {
      createContactSchema.parse(data);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        };
      }
      return {
        success: false,
        errors: [{ field: 'unknown', message: 'Validation failed' }],
      };
    }
  }

  validateUpdateContact(data: any): { success: boolean; errors?: any } {
    try {
      updateContactSchema.parse(data);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        };
      }
      return {
        success: false,
        errors: [{ field: 'unknown', message: 'Validation failed' }],
      };
    }
  }

  validateId(id: string): { success: boolean; errors?: any } {
    try {
      idSchema.parse(id);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        };
      }
      return {
        success: false,
        errors: [{ field: 'id', message: 'Invalid ID format' }],
      };
    }
  }

  validateSearchParams(params: any): { success: boolean; errors?: any; data?: any } {
    try {
      const validatedData = searchParamsSchema.parse(params);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        };
      }
      return {
        success: false,
        errors: [{ field: 'unknown', message: 'Validation failed' }],
      };
    }
  }

  validatePagination(params: any): { success: boolean; errors?: any; data?: any } {
    try {
      const validatedData = paginationSchema.parse(params);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        };
      }
      return {
        success: false,
        errors: [{ field: 'unknown', message: 'Validation failed' }],
      };
    }
  }

  validateBulkOperation(data: any): { success: boolean; errors?: any } {
    try {
      bulkOperationSchema.parse(data);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        };
      }
      return {
        success: false,
        errors: [{ field: 'unknown', message: 'Validation failed' }],
      };
    }
  }

  validateCategory(category: string): boolean {
    return contactCategorySchema.safeParse(category).success;
  }

  validateStatus(status: string): boolean {
    return contactStatusSchema.safeParse(status).success;
  }

  validateEmail(email: string): boolean {
    return z.string().email().safeParse(email).success;
  }

  validatePhone(phone: string): boolean {
    if (!phone) return true; // Phone is optional
    return /^\+?[\d\s\-\(\)]+$/.test(phone);
  }
}

