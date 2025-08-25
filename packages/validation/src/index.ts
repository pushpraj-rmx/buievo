// Validation schemas for WhatsSuite
// Comprehensive validation system with Zod schemas

// Base schemas
export * from './schemas/base';

// Authentication and authorization schemas
export * from './schemas/auth';

// Contact schemas
export * from './schemas/contact';

// Campaign schemas
export * from './schemas/campaign';

// Validation utilities
export * from './utils/validator';

// Legacy exports for backward compatibility
import { z } from "zod";
import type {
  CreateContactRequest,
  CreateCampaignRequest,
  CreateTemplateRequest,
  SendMessageRequest,
  PaginationParams,
  WhatsAppMessagePayload
} from "@whatssuite/types";

// Base validation schemas (legacy)
export const phoneNumberSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
  .min(10, "Phone number too short")
  .max(15, "Phone number too long");

export const emailSchema = z
  .string()
  .email("Invalid email format")
  .optional()
  .nullable();

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Contact validation schemas (legacy)
export const createContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: emailSchema,
  phone: phoneNumberSchema,
  status: z.enum(["active", "inactive", "pending"]).default("active"),
  comment: z.string().max(500, "Comment too long").optional().nullable(),
  segmentIds: z.array(z.string().uuid()).optional(),
});

export const updateContactSchema = createContactSchema.partial();

// Campaign validation schemas (legacy)
export const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required").max(100, "Campaign name too long"),
  description: z.string().max(500, "Description too long").optional(),
  status: z.enum(["draft", "active", "paused", "completed", "cancelled"]).default("draft"),
  targetSegmentIds: z.array(z.string().uuid()).min(1, "At least one segment is required"),
  templateId: z.string().uuid("Invalid template ID"),
  scheduledAt: z.date().optional(),
  messageContent: z.string().min(1, "Message content is required").max(1000, "Message content too long"),
});

export const updateCampaignSchema = createCampaignSchema.partial();

// Template validation schemas (legacy)
export const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100, "Template name too long"),
  category: z.enum(["MARKETING", "UTILITY", "AUTHENTICATION"]),
  language: z.string().min(2, "Language code is required").max(5, "Language code too long"),
  content: z.any(), // Template content can be complex
  components: z.array(z.object({
    type: z.enum(["HEADER", "BODY", "FOOTER", "BUTTONS"]),
    text: z.string().optional(),
    format: z.enum(["TEXT", "IMAGE", "VIDEO", "DOCUMENT"]).optional(),
    example: z.array(z.string()).optional(),
  })).min(1, "At least one component is required"),
  status: z.enum(["APPROVED", "PENDING", "REJECTED"]).default("PENDING"),
});

export const updateTemplateSchema = createTemplateSchema.partial();

// Message validation schemas (legacy)
export const sendMessageSchema = z.object({
  to: z.string().min(1, "Recipient is required"),
  contactId: z.string().uuid("Invalid contact ID"),
  content: z.string().min(1, "Message content is required").max(1000, "Message content too long"),
  type: z.enum(["text", "image", "document", "template"]).default("text"),
  templateName: z.string().optional(),
  templateParams: z.array(z.string()).optional(),
  mediaUrl: z.string().url("Invalid media URL").optional(),
  filename: z.string().optional(),
});

// Segment validation schemas (legacy)
export const createSegmentSchema = z.object({
  name: z.string().min(1, "Segment name is required").max(100, "Segment name too long"),
  description: z.string().max(500, "Description too long").optional(),
  criteria: z.object({
    status: z.enum(["active", "inactive", "pending"]).optional(),
    tags: z.array(z.string()).optional(),
    lastContacted: z.object({
      from: z.date().optional(),
      to: z.date().optional(),
    }).optional(),
  }).optional(),
});

export const updateSegmentSchema = createSegmentSchema.partial();

// Media validation schemas (legacy)
export const uploadMediaSchema = z.object({
  file: z.instanceof(File, { message: "File is required" }),
  type: z.enum(["image", "document", "video", "audio"]),
  caption: z.string().max(500, "Caption too long").optional(),
  filename: z.string().optional(),
});

// WhatsApp validation schemas (legacy)
export const whatsAppMessageSchema = z.object({
  messaging_product: z.literal("whatsapp"),
  to: phoneNumberSchema,
  type: z.enum(["text", "image", "document", "template"]),
  text: z.object({
    body: z.string().min(1, "Text body is required").max(4096, "Text too long"),
  }).optional(),
  template: z.object({
    name: z.string().min(1, "Template name is required"),
    language: z.object({
      code: z.string().min(2, "Language code is required"),
    }),
    components: z.array(z.object({
      type: z.enum(["HEADER", "BODY", "FOOTER", "BUTTONS"]),
      parameters: z.array(z.object({
        type: z.enum(["text", "image", "document"]),
        text: z.string().optional(),
        image: z.object({
          link: z.string().url("Invalid image URL"),
        }).optional(),
        document: z.object({
          link: z.string().url("Invalid document URL"),
          filename: z.string().optional(),
        }).optional(),
      })).optional(),
    })).optional(),
  }).optional(),
  image: z.object({
    link: z.string().url("Invalid image URL"),
    caption: z.string().max(500, "Caption too long").optional(),
  }).optional(),
  document: z.object({
    link: z.string().url("Invalid document URL"),
    filename: z.string().optional(),
  }).optional(),
});

// Type exports for use in other packages (legacy)
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateSegmentInput = z.infer<typeof createSegmentSchema>;
export type UpdateSegmentInput = z.infer<typeof updateSegmentSchema>;
export type UploadMediaInput = z.infer<typeof uploadMediaSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type WhatsAppMessageInput = z.infer<typeof whatsAppMessageSchema>;

// Validation functions (legacy)
export const validateContact = (data: unknown): CreateContactRequest => {
  const result = createContactSchema.parse(data);
  return result as CreateContactRequest;
};

export const validateCampaign = (data: unknown): CreateCampaignRequest => {
  const result = createCampaignSchema.parse(data);
  return result as CreateCampaignRequest;
};

export const validateTemplate = (data: unknown): CreateTemplateRequest => {
  const result = createTemplateSchema.parse(data);
  return result as CreateTemplateRequest;
};

export const validateMessage = (data: unknown): SendMessageRequest => {
  const result = sendMessageSchema.parse(data);
  return result as SendMessageRequest;
};

export const validateWhatsAppMessage = (data: unknown): WhatsAppMessagePayload => {
  const result = whatsAppMessageSchema.parse(data);
  return result as WhatsAppMessagePayload;
};

export const validatePagination = (data: unknown): PaginationParams => {
  const result = paginationSchema.parse(data);
  return result as PaginationParams;
};
