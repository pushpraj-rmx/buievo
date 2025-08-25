// API types for request/response structures

import type { Contact, Campaign, Segment, Template, Message, Conversation, MediaAsset } from './database';

// Common API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
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
  content: any; // WhatsApp template structure
}

export interface UpdateTemplateRequest {
  name?: string;
  content?: any;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

// Message API types
export interface SendMessageRequest {
  contactId: string;
  content: string;
  type?: 'text' | 'image' | 'document' | 'template';
  templateName?: string;
  templateParams?: string[];
  mediaUrl?: string;
  filename?: string;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  content: string;
  type: string;
  direction: string;
  status: string;
  whatsappId?: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

// Conversation API types
export interface ConversationSummary {
  id: string;
  contactId: string;
  contact: Contact;
  lastMessageAt: Date;
  unreadCount: number;
  lastMessage: MessageResponse;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationWithMessages extends ConversationSummary {
  messages: MessageResponse[];
}

export interface ConversationSummary {
  id: string;
  contactId: string;
  contact: Contact;
  lastMessage: MessageResponse;
  unreadCount: number;
  updatedAt: string;
}

// Media API types
export interface UploadMediaRequest {
  file: File;
  type: string;
}

export interface MediaUploadResponse {
  id: string;
  waMediaId: string;
  type: string;
  mimeType: string;
  fileName?: string;
  size?: number;
  url?: string;
  status: string;
}

// Webhook types
export interface WebhookEvent {
  event: string;
  payload: any;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Filter types
export interface CampaignFilters {
  status?: string;
  search?: string;
}

export interface ContactFilters {
  status?: string;
  search?: string;
  segmentId?: string;
}

export interface TemplateFilters {
  status?: string;
  search?: string;
}
