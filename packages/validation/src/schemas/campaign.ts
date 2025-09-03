// Campaign validation schemas for buievo

import { z } from "zod";
import { 
  nameSchema, 
  descriptionSchema, 
  uuidSchema,
  paginationSchema,
  dateSchema,
  futureDateSchema
} from "./base";

// Campaign status schemas
export const campaignStatusSchema = z.enum(["draft", "scheduled", "active", "paused", "completed", "cancelled", "failed"]);

// Campaign schemas
export const createCampaignSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  status: campaignStatusSchema.default("draft"),
  targetSegmentIds: z.array(uuidSchema).min(1, "At least one segment is required"),
  templateId: uuidSchema,
  scheduledAt: futureDateSchema.optional(),
  messageContent: z.string().min(1, "Message content is required").max(1000, "Message content too long"),
  settings: z.object({
    sendImmediately: z.boolean().default(false),
    batchSize: z.number().int().positive().max(1000).default(100),
    delayBetweenBatches: z.number().int().nonnegative().max(3600).default(60), // seconds
    maxRetries: z.number().int().nonnegative().max(10).default(3),
    retryDelay: z.number().int().nonnegative().max(3600).default(300), // seconds
    stopOnError: z.boolean().default(false),
    trackOpens: z.boolean().default(true),
    trackClicks: z.boolean().default(true),
  }).optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export const campaignSchema = z.object({
  id: uuidSchema,
  name: nameSchema,
  description: descriptionSchema,
  status: campaignStatusSchema,
  targetSegmentIds: z.array(uuidSchema),
  templateId: uuidSchema,
  scheduledAt: dateSchema.optional(),
  messageContent: z.string(),
  settings: z.record(z.any()),
  metadata: z.record(z.any()),
  sentCount: z.number().int().nonnegative().default(0),
  deliveredCount: z.number().int().nonnegative().default(0),
  failedCount: z.number().int().nonnegative().default(0),
  readCount: z.number().int().nonnegative().default(0),
  clickedCount: z.number().int().nonnegative().default(0),
  startedAt: dateSchema.optional(),
  completedAt: dateSchema.optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// Campaign action schemas
export const startCampaignSchema = z.object({
  campaignId: uuidSchema,
  sendImmediately: z.boolean().default(false),
});

export const pauseCampaignSchema = z.object({
  campaignId: uuidSchema,
  reason: z.string().max(200).optional(),
});

export const resumeCampaignSchema = z.object({
  campaignId: uuidSchema,
});

export const cancelCampaignSchema = z.object({
  campaignId: uuidSchema,
  reason: z.string().max(200).optional(),
});

export const duplicateCampaignSchema = z.object({
  campaignId: uuidSchema,
  newName: nameSchema,
  copySettings: z.boolean().default(true),
  copySegments: z.boolean().default(true),
});

// Campaign metrics schemas
export const campaignMetricsSchema = z.object({
  campaignId: uuidSchema,
  sentCount: z.number().int().nonnegative(),
  deliveredCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
  readCount: z.number().int().nonnegative(),
  clickedCount: z.number().int().nonnegative(),
  bounceCount: z.number().int().nonnegative(),
  unsubscribedCount: z.number().int().nonnegative(),
  complaintCount: z.number().int().nonnegative(),
  deliveryRate: z.number().min(0).max(1),
  openRate: z.number().min(0).max(1),
  clickRate: z.number().min(0).max(1),
  bounceRate: z.number().min(0).max(1),
  lastUpdated: dateSchema,
});

export const updateCampaignMetricsSchema = z.object({
  campaignId: uuidSchema,
  metrics: z.object({
    sentCount: z.number().int().nonnegative().optional(),
    deliveredCount: z.number().int().nonnegative().optional(),
    failedCount: z.number().int().nonnegative().optional(),
    readCount: z.number().int().nonnegative().optional(),
    clickedCount: z.number().int().nonnegative().optional(),
    bounceCount: z.number().int().nonnegative().optional(),
    unsubscribedCount: z.number().int().nonnegative().optional(),
    complaintCount: z.number().int().nonnegative().optional(),
  }),
});

// Campaign analytics schemas
export const campaignAnalyticsSchema = z.object({
  campaignId: uuidSchema,
  timeRange: z.object({
    start: dateSchema,
    end: dateSchema,
  }),
  metrics: z.object({
    totalSent: z.number().int().nonnegative(),
    totalDelivered: z.number().int().nonnegative(),
    totalFailed: z.number().int().nonnegative(),
    totalRead: z.number().int().nonnegative(),
    totalClicked: z.number().int().nonnegative(),
    deliveryRate: z.number().min(0).max(1),
    openRate: z.number().min(0).max(1),
    clickRate: z.number().min(0).max(1),
    bounceRate: z.number().min(0).max(1),
  }),
  timeSeries: z.array(z.object({
    timestamp: dateSchema,
    sent: z.number().int().nonnegative(),
    delivered: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    read: z.number().int().nonnegative(),
    clicked: z.number().int().nonnegative(),
  })),
  segmentBreakdown: z.array(z.object({
    segmentId: uuidSchema,
    segmentName: z.string(),
    sent: z.number().int().nonnegative(),
    delivered: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    read: z.number().int().nonnegative(),
    clicked: z.number().int().nonnegative(),
    deliveryRate: z.number().min(0).max(1),
    openRate: z.number().min(0).max(1),
    clickRate: z.number().min(0).max(1),
  })),
});

// Campaign filter and search schemas
export const campaignFilterSchema = z.object({
  status: z.array(campaignStatusSchema).optional(),
  templateId: uuidSchema.optional(),
  segmentIds: z.array(uuidSchema).optional(),
  scheduledFrom: dateSchema.optional(),
  scheduledTo: dateSchema.optional(),
  startedFrom: dateSchema.optional(),
  startedTo: dateSchema.optional(),
  completedFrom: dateSchema.optional(),
  completedTo: dateSchema.optional(),
  createdAtFrom: dateSchema.optional(),
  createdAtTo: dateSchema.optional(),
  updatedAtFrom: dateSchema.optional(),
  updatedAtTo: dateSchema.optional(),
  hasErrors: z.boolean().optional(),
  minDeliveryRate: z.number().min(0).max(1).optional(),
  maxDeliveryRate: z.number().min(0).max(1).optional(),
});

export const campaignSearchSchema = z.object({
  query: z.string().min(1).max(200),
  fields: z.array(z.enum(["name", "description", "messageContent"])).default(["name", "description"]),
  fuzzy: z.boolean().default(true),
  highlight: z.boolean().default(false),
  maxResults: z.number().int().positive().max(1000).default(100),
});

export const campaignListSchema = z.object({
  pagination: paginationSchema.optional(),
  filters: campaignFilterSchema.optional(),
  search: campaignSearchSchema.optional(),
  sortBy: z.enum(["name", "status", "scheduledAt", "startedAt", "completedAt", "createdAt", "updatedAt", "sentCount", "deliveryRate"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Campaign statistics schemas
export const campaignStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  draft: z.number().int().nonnegative(),
  scheduled: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  paused: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  cancelled: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  totalSent: z.number().int().nonnegative(),
  totalDelivered: z.number().int().nonnegative(),
  totalFailed: z.number().int().nonnegative(),
  totalRead: z.number().int().nonnegative(),
  totalClicked: z.number().int().nonnegative(),
  averageDeliveryRate: z.number().min(0).max(1),
  averageOpenRate: z.number().min(0).max(1),
  averageClickRate: z.number().min(0).max(1),
  recentActivity: z.object({
    last24h: z.number().int().nonnegative(),
    last7d: z.number().int().nonnegative(),
    last30d: z.number().int().nonnegative(),
  }),
  topPerforming: z.array(z.object({
    campaignId: uuidSchema,
    name: nameSchema,
    deliveryRate: z.number().min(0).max(1),
    openRate: z.number().min(0).max(1),
    clickRate: z.number().min(0).max(1),
  })),
});

// Campaign export schemas
export const campaignExportSchema = z.object({
  format: z.enum(["csv", "xlsx", "json"]),
  fields: z.array(z.enum([
    "id", "name", "description", "status", "templateId", "scheduledAt", 
    "messageContent", "sentCount", "deliveredCount", "failedCount", 
    "readCount", "clickedCount", "startedAt", "completedAt", "createdAt", "updatedAt"
  ])).min(1, "At least one field must be selected"),
  filters: campaignFilterSchema.optional(),
  search: campaignSearchSchema.optional(),
  includeMetrics: z.boolean().default(false),
  includeAnalytics: z.boolean().default(false),
});

// Campaign webhook schemas
export const campaignWebhookSchema = z.object({
  event: z.enum(["created", "updated", "started", "paused", "resumed", "completed", "cancelled", "failed"]),
  campaign: campaignSchema,
  previousData: campaignSchema.optional(),
  changes: z.record(z.any()).optional(),
  timestamp: dateSchema,
  webhookId: uuidSchema,
});

// Export types
export type CampaignStatus = z.infer<typeof campaignStatusSchema>;
export type CreateCampaign = z.infer<typeof createCampaignSchema>;
export type UpdateCampaign = z.infer<typeof updateCampaignSchema>;
export type Campaign = z.infer<typeof campaignSchema>;
export type StartCampaign = z.infer<typeof startCampaignSchema>;
export type PauseCampaign = z.infer<typeof pauseCampaignSchema>;
export type ResumeCampaign = z.infer<typeof resumeCampaignSchema>;
export type CancelCampaign = z.infer<typeof cancelCampaignSchema>;
export type DuplicateCampaign = z.infer<typeof duplicateCampaignSchema>;
export type CampaignMetrics = z.infer<typeof campaignMetricsSchema>;
export type UpdateCampaignMetrics = z.infer<typeof updateCampaignMetricsSchema>;
export type CampaignAnalytics = z.infer<typeof campaignAnalyticsSchema>;
export type CampaignFilter = z.infer<typeof campaignFilterSchema>;
export type CampaignSearch = z.infer<typeof campaignSearchSchema>;
export type CampaignList = z.infer<typeof campaignListSchema>;
export type CampaignStats = z.infer<typeof campaignStatsSchema>;
export type CampaignExport = z.infer<typeof campaignExportSchema>;
export type CampaignWebhook = z.infer<typeof campaignWebhookSchema>;
