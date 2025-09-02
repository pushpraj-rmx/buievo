// API types for request/response structures

import type { Contact, Campaign, Segment, Template, Message, Conversation, MediaAsset } from './database';

// Common API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Service return types
export interface ServiceResponse<T> {
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ContactServiceResponse extends ServiceResponse<Contact[]> {}
export interface CampaignServiceResponse extends ServiceResponse<Campaign[]> {}
export interface TemplateServiceResponse extends ServiceResponse<Template[]> {}
export interface ConversationServiceResponse extends ServiceResponse<Conversation[]> {}

// Single item service responses
export interface SingleContactResponse {
  contact: Contact | null;
}

export interface SingleCampaignResponse {
  campaign: Campaign | null;
}

export interface SingleTemplateResponse {
  template: Template | null;
}

export interface SingleConversationResponse {
  conversation: Conversation | null;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Contact API types
export interface CreateContactRequest {
  name: string;
  email?: string;
  phone: string;
  comment?: string;
}

export interface UpdateContactRequest {
  name?: string;
  email?: string;
  phone?: string;
  comment?: string;
  status?: 'active' | 'inactive' | 'pending';
}

export interface ContactWithSegments extends Contact {
  segments: Segment[];
}

// Campaign API types
export interface CreateCampaignRequest {
  name: string;
  templateId: string;
  targetSegmentIds: string[];
  scheduledAt?: Date;
}

export interface UpdateCampaignRequest {
  name?: string;
  templateId?: string;
  targetSegmentIds?: string[];
  scheduledAt?: Date;
  status?: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
}

export interface CampaignAnalytics {
  campaignId: string;
  totalContacts: number;
  sentMessages: number;
  deliveredMessages: number;
  failedMessages: number;
  openRate: number;
  clickRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignStats {
  total: number;
  draft: number;
  active: number;
  paused: number;
  completed: number;
  cancelled: number;
}

// Segment API types
export interface CreateSegmentRequest {
  name: string;
  contactIds?: string[];
}

export interface UpdateSegmentRequest {
  name?: string;
  contactIds?: string[];
}

// Template API types
export interface CreateTemplateRequest {
  name: string;
  content: any;
}

export interface UpdateTemplateRequest {
  name?: string;
  content?: any;
  status?: 'draft' | 'pending' | 'approved' | 'rejected';
}

// Message API types
export interface SendMessageRequest {
  contactId: string;
  content: string;
  type: 'text' | 'image' | 'document' | 'template';
  templateParams?: Record<string, string>;
  mediaUrl?: string;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  content: string;
  type: string;
  direction: string;
  status: string;
  timestamp: string;
  whatsappId?: string;
  createdAt: string;
  updatedAt: string;
}

// Conversation API types
export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface ConversationSummary {
  id: string;
  contactId: string;
  contact: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
  };
  lastMessage: {
    content: string;
    timestamp: string;
  };
  unreadCount: number;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

// Media API types
export interface UploadMediaRequest {
  file: any; // Express.Multer.File - will be properly typed in the API layer
  type: 'image' | 'document' | 'video' | 'audio';
}

export interface MediaUploadResponse {
  id: string;
  url: string;
  type: string;
  size: number;
  mimeType: string;
  recordId?: string;
}

// Webhook types
export interface WebhookEvent {
  type: string;
  payload: any;
  timestamp: string;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Filter types
export interface ContactFilters {
  search?: string;
  status?: string;
  segmentId?: string;
}

export interface CampaignFilters {
  search?: string;
  status?: string;
  templateId?: string;
}

export interface TemplateFilters {
  search?: string;
  status?: string;
  category?: string;
}

