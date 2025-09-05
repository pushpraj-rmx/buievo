// Base validation schemas for buievo

import { z } from "zod";

// Common validation patterns
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const CUID_REGEX = /^c[a-z0-9]{24}$/i;
export const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const URL_REGEX = /^https?:\/\/.+/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Base schemas
export const uuidSchema = z
  .string()
  .regex(UUID_REGEX, "Invalid UUID format")
  .min(36, "UUID too short")
  .max(36, "UUID too long");

export const cuidSchema = z
  .string()
  .regex(CUID_REGEX, "Invalid CUID format")
  .min(25, "CUID too short")
  .max(25, "CUID too long");

export const flexibleIdSchema = z
  .string()
  .refine((val) => UUID_REGEX.test(val) || CUID_REGEX.test(val), "Invalid ID format - must be UUID or CUID");

export const phoneNumberSchema = z
  .string()
  .regex(PHONE_REGEX, "Invalid phone number format")
  .min(10, "Phone number too short")
  .max(15, "Phone number too long")
  .transform((val) => val.startsWith('+') ? val : `+${val}`);

export const emailSchema = z
  .string()
  .email("Invalid email format")
  .min(5, "Email too short")
  .max(254, "Email too long")
  .toLowerCase()
  .optional()
  .nullable();

export const urlSchema = z
  .string()
  .url("Invalid URL format")
  .regex(URL_REGEX, "URL must start with http:// or https://")
  .max(2048, "URL too long");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(PASSWORD_REGEX, "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character");

export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name too long")
  .trim()
  .regex(/^[a-zA-Z0-9\s\-_\.]+$/, "Name contains invalid characters");

export const descriptionSchema = z
  .string()
  .max(500, "Description too long")
  .optional()
  .nullable();

export const commentSchema = z
  .string()
  .max(1000, "Comment too long")
  .optional()
  .nullable();

// Date schemas
export const dateSchema = z
  .date()
  .or(z.string().datetime())
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
  .transform((val) => new Date(val));

export const futureDateSchema = dateSchema.refine(
  (date) => date > new Date(),
  "Date must be in the future"
);

export const pastDateSchema = dateSchema.refine(
  (date) => date < new Date(),
  "Date must be in the past"
);

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  search: z.string().max(100).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  offset: z.number().int().nonnegative().optional(),
});

export const cursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().positive().max(100).default(20),
  direction: z.enum(["forward", "backward"]).default("forward"),
});

// Filter schemas
export const filterOperatorSchema = z.enum([
  "eq", "ne", "gt", "gte", "lt", "lte", 
  "in", "nin", "like", "ilike", "regex", "exists"
]);

export const filterConditionSchema = z.object({
  field: z.string().min(1).max(50),
  operator: filterOperatorSchema,
  value: z.any(),
});

export const filterParamsSchema = z.object({
  filters: z.array(filterConditionSchema).max(20),
  logicalOperator: z.enum(["and", "or"]).default("and"),
});

// Search schemas
export const searchParamsSchema = z.object({
  query: z.string().min(1).max(200),
  fields: z.array(z.string()).max(10).optional(),
  fuzzy: z.boolean().default(false),
  highlight: z.boolean().default(false),
  maxResults: z.number().int().positive().max(1000).default(100),
});

// File schemas
export const fileSchema = z.object({
  name: z.string().min(1).max(255),
  size: z.number().positive().max(100 * 1024 * 1024), // 100MB max
  type: z.string().min(1).max(100),
  lastModified: z.number().optional(),
});

export const imageFileSchema = fileSchema.extend({
  type: z.string().regex(/^image\//, "File must be an image"),
  size: z.number().positive().max(10 * 1024 * 1024), // 10MB max for images
});

export const documentFileSchema = fileSchema.extend({
  type: z.string().regex(/^(application|text)\//, "File must be a document"),
  size: z.number().positive().max(50 * 1024 * 1024), // 50MB max for documents
});

export const videoFileSchema = fileSchema.extend({
  type: z.string().regex(/^video\//, "File must be a video"),
  size: z.number().positive().max(100 * 1024 * 1024), // 100MB max for videos
});

export const audioFileSchema = fileSchema.extend({
  type: z.string().regex(/^audio\//, "File must be an audio file"),
  size: z.number().positive().max(50 * 1024 * 1024), // 50MB max for audio
});

// Status schemas
export const statusSchema = z.enum(["active", "inactive", "pending", "deleted"]);
export const approvalStatusSchema = z.enum(["pending", "approved", "rejected"]);
export const processingStatusSchema = z.enum(["pending", "processing", "completed", "failed"]);

// ID schemas
export const idSchema = z.union([z.string().min(1), z.number().positive()]);
export const autoIncrementIdSchema = z.number().positive();
export const stringIdSchema = z.string().min(1).max(255);

// Validation result schemas
export const validationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string(),
  value: z.any().optional(),
});

export const validationWarningSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string(),
  value: z.any().optional(),
});

export const validationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(validationErrorSchema),
  warnings: z.array(validationWarningSchema),
});

// Common object schemas
export const metadataSchema = z.object({
  createdAt: dateSchema.optional(),
  updatedAt: dateSchema.optional(),
  createdBy: uuidSchema.optional(),
  updatedBy: uuidSchema.optional(),
  version: z.number().int().positive().optional(),
  tags: z.array(z.string()).max(20).optional(),
});

export const auditSchema = z.object({
  createdBy: uuidSchema,
  createdAt: dateSchema,
  updatedBy: uuidSchema.optional(),
  updatedAt: dateSchema.optional(),
  deletedBy: uuidSchema.optional(),
  deletedAt: dateSchema.optional(),
});

// Export types
export type UUID = z.infer<typeof uuidSchema>;
export type PhoneNumber = z.infer<typeof phoneNumberSchema>;
export type Email = z.infer<typeof emailSchema>;
export type URL = z.infer<typeof urlSchema>;
export type Password = z.infer<typeof passwordSchema>;
export type Name = z.infer<typeof nameSchema>;
export type Description = z.infer<typeof descriptionSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type Date = z.infer<typeof dateSchema>;
export type FutureDate = z.infer<typeof futureDateSchema>;
export type PastDate = z.infer<typeof pastDateSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type CursorPagination = z.infer<typeof cursorPaginationSchema>;
export type FilterOperator = z.infer<typeof filterOperatorSchema>;
export type FilterCondition = z.infer<typeof filterConditionSchema>;
export type FilterParams = z.infer<typeof filterParamsSchema>;
export type SearchParams = z.infer<typeof searchParamsSchema>;
export type File = z.infer<typeof fileSchema>;
export type ImageFile = z.infer<typeof imageFileSchema>;
export type DocumentFile = z.infer<typeof documentFileSchema>;
export type VideoFile = z.infer<typeof videoFileSchema>;
export type AudioFile = z.infer<typeof audioFileSchema>;
export type Status = z.infer<typeof statusSchema>;
export type ApprovalStatus = z.infer<typeof approvalStatusSchema>;
export type ProcessingStatus = z.infer<typeof processingStatusSchema>;
export type ID = z.infer<typeof idSchema>;
export type AutoIncrementID = z.infer<typeof autoIncrementIdSchema>;
export type StringID = z.infer<typeof stringIdSchema>;
export type ValidationError = z.infer<typeof validationErrorSchema>;
export type ValidationWarning = z.infer<typeof validationWarningSchema>;
export type ValidationResult = z.infer<typeof validationResultSchema>;
export type Metadata = z.infer<typeof metadataSchema>;
export type Audit = z.infer<typeof auditSchema>;
