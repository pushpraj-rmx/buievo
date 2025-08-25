// Contact validation schemas for WhatsSuite

import { z } from "zod";
import { 
  nameSchema, 
  emailSchema, 
  phoneNumberSchema, 
  uuidSchema,
  statusSchema,
  commentSchema,
  paginationSchema,
  filterParamsSchema,
  searchParamsSchema,
  dateSchema
} from "./base";

// Contact schemas
export const createContactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneNumberSchema,
  status: statusSchema.default("active"),
  comment: commentSchema,
  tags: z.array(z.string().max(50)).max(20).optional(),
  customFields: z.record(z.any()).optional(),
  source: z.enum(["manual", "import", "api", "webhook", "form"]).default("manual"),
  segmentIds: z.array(uuidSchema).optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateContactSchema = createContactSchema.partial();

export const contactSchema = z.object({
  id: uuidSchema,
  name: nameSchema,
  email: emailSchema,
  phone: phoneNumberSchema,
  status: statusSchema,
  comment: commentSchema,
  tags: z.array(z.string().max(50)).max(20),
  customFields: z.record(z.any()),
  source: z.enum(["manual", "import", "api", "webhook", "form"]),
  whatsappId: z.string().optional(),
  lastContactedAt: dateSchema.optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// Contact import schemas
export const contactImportSchema = z.object({
  file: z.instanceof(File, { message: "File is required" }),
  format: z.enum(["csv", "xlsx", "json"]),
  hasHeader: z.boolean().default(true),
  mapping: z.record(z.string()).optional(),
  updateExisting: z.boolean().default(false),
  defaultStatus: statusSchema.default("active"),
  defaultTags: z.array(z.string().max(50)).optional(),
});

export const contactImportResultSchema = z.object({
  total: z.number().int().nonnegative(),
  imported: z.number().int().nonnegative(),
  updated: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  errors: z.array(z.object({
    row: z.number().int().positive(),
    field: z.string(),
    message: z.string(),
    value: z.any(),
  })),
});

// Contact bulk operations schemas
export const contactBulkUpdateSchema = z.object({
  contactIds: z.array(uuidSchema).min(1, "At least one contact ID is required").max(1000),
  updates: z.object({
    status: statusSchema.optional(),
    tags: z.array(z.string().max(50)).optional(),
    customFields: z.record(z.any()).optional(),
    comment: commentSchema.optional(),
  }).refine((data) => Object.keys(data).length > 0, "At least one field must be updated"),
});

export const contactBulkDeleteSchema = z.object({
  contactIds: z.array(uuidSchema).min(1, "At least one contact ID is required").max(1000),
  reason: z.string().max(200).optional(),
});

export const contactBulkTagSchema = z.object({
  contactIds: z.array(uuidSchema).min(1, "At least one contact ID is required").max(1000),
  tags: z.array(z.string().max(50)).min(1, "At least one tag is required"),
  action: z.enum(["add", "remove", "replace"]).default("add"),
});

// Contact segment schemas
export const addContactToSegmentsSchema = z.object({
  contactId: uuidSchema,
  segmentIds: z.array(uuidSchema).min(1, "At least one segment ID is required"),
});

export const removeContactFromSegmentsSchema = z.object({
  contactId: uuidSchema,
  segmentIds: z.array(uuidSchema).min(1, "At least one segment ID is required"),
});

export const getContactsBySegmentSchema = z.object({
  segmentId: uuidSchema,
  pagination: paginationSchema.optional(),
  filters: filterParamsSchema.optional(),
  search: searchParamsSchema.optional(),
});

// Contact search and filter schemas
export const contactSearchSchema = z.object({
  query: z.string().min(1).max(200),
  fields: z.array(z.enum(["name", "email", "phone", "comment", "tags"])).default(["name", "email", "phone"]),
  fuzzy: z.boolean().default(true),
  highlight: z.boolean().default(false),
  maxResults: z.number().int().positive().max(1000).default(100),
});

export const contactFilterSchema = z.object({
  status: z.array(statusSchema).optional(),
  tags: z.array(z.string().max(50)).optional(),
  source: z.array(z.enum(["manual", "import", "api", "webhook", "form"])).optional(),
  segmentIds: z.array(uuidSchema).optional(),
  hasWhatsappId: z.boolean().optional(),
  lastContactedFrom: dateSchema.optional(),
  lastContactedTo: dateSchema.optional(),
  createdAtFrom: dateSchema.optional(),
  createdAtTo: dateSchema.optional(),
  updatedAtFrom: dateSchema.optional(),
  updatedAtTo: dateSchema.optional(),
  customFields: z.record(z.any()).optional(),
});

export const contactListSchema = z.object({
  pagination: paginationSchema.optional(),
  filters: contactFilterSchema.optional(),
  search: contactSearchSchema.optional(),
  sortBy: z.enum(["name", "email", "phone", "status", "createdAt", "updatedAt", "lastContactedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Contact validation schemas
export const validateContactPhoneSchema = z.object({
  phone: phoneNumberSchema,
  countryCode: z.string().length(2).optional(),
});

export const validateContactEmailSchema = z.object({
  email: emailSchema,
  checkDisposable: z.boolean().default(false),
  checkMX: z.boolean().default(false),
});

export const contactValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
    code: z.string(),
    value: z.any(),
  })),
  warnings: z.array(z.object({
    field: z.string(),
    message: z.string(),
    code: z.string(),
    value: z.any(),
  })),
  suggestions: z.array(z.object({
    field: z.string(),
    suggestion: z.string(),
    confidence: z.number().min(0).max(1),
  })),
});

// Contact duplicate detection schemas
export const contactDuplicateCheckSchema = z.object({
  email: emailSchema.optional(),
  phone: phoneNumberSchema.optional(),
  name: nameSchema.optional(),
  excludeId: uuidSchema.optional(),
});

export const contactDuplicateResultSchema = z.object({
  hasDuplicates: z.boolean(),
  duplicates: z.array(z.object({
    id: uuidSchema,
    name: nameSchema,
    email: emailSchema,
    phone: phoneNumberSchema,
    similarity: z.number().min(0).max(1),
    matchFields: z.array(z.string()),
  })),
});

// Contact statistics schemas
export const contactStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  inactive: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  deleted: z.number().int().nonnegative(),
  withWhatsappId: z.number().int().nonnegative(),
  withoutWhatsappId: z.number().int().nonnegative(),
  bySource: z.record(z.number().int().nonnegative()),
  byTag: z.record(z.number().int().nonnegative()),
  recentActivity: z.object({
    last24h: z.number().int().nonnegative(),
    last7d: z.number().int().nonnegative(),
    last30d: z.number().int().nonnegative(),
  }),
});

// Contact export schemas
export const contactExportSchema = z.object({
  format: z.enum(["csv", "xlsx", "json"]),
  fields: z.array(z.enum([
    "id", "name", "email", "phone", "status", "comment", "tags", 
    "source", "whatsappId", "lastContactedAt", "createdAt", "updatedAt"
  ])).min(1, "At least one field must be selected"),
  filters: contactFilterSchema.optional(),
  search: contactSearchSchema.optional(),
  includeCustomFields: z.boolean().default(false),
  includeSegments: z.boolean().default(false),
});

// Contact webhook schemas
export const contactWebhookSchema = z.object({
  event: z.enum(["created", "updated", "deleted", "tagged", "untagged"]),
  contact: contactSchema,
  previousData: contactSchema.optional(),
  changes: z.record(z.any()).optional(),
  timestamp: dateSchema,
  webhookId: uuidSchema,
});

// Export types
export type CreateContact = z.infer<typeof createContactSchema>;
export type UpdateContact = z.infer<typeof updateContactSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type ContactImport = z.infer<typeof contactImportSchema>;
export type ContactImportResult = z.infer<typeof contactImportResultSchema>;
export type ContactBulkUpdate = z.infer<typeof contactBulkUpdateSchema>;
export type ContactBulkDelete = z.infer<typeof contactBulkDeleteSchema>;
export type ContactBulkTag = z.infer<typeof contactBulkTagSchema>;
export type AddContactToSegments = z.infer<typeof addContactToSegmentsSchema>;
export type RemoveContactFromSegments = z.infer<typeof removeContactFromSegmentsSchema>;
export type GetContactsBySegment = z.infer<typeof getContactsBySegmentSchema>;
export type ContactSearch = z.infer<typeof contactSearchSchema>;
export type ContactFilter = z.infer<typeof contactFilterSchema>;
export type ContactList = z.infer<typeof contactListSchema>;
export type ValidateContactPhone = z.infer<typeof validateContactPhoneSchema>;
export type ValidateContactEmail = z.infer<typeof validateContactEmailSchema>;
export type ContactValidationResult = z.infer<typeof contactValidationResultSchema>;
export type ContactDuplicateCheck = z.infer<typeof contactDuplicateCheckSchema>;
export type ContactDuplicateResult = z.infer<typeof contactDuplicateResultSchema>;
export type ContactStats = z.infer<typeof contactStatsSchema>;
export type ContactExport = z.infer<typeof contactExportSchema>;
export type ContactWebhook = z.infer<typeof contactWebhookSchema>;
