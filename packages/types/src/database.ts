// Database types based on Prisma schema

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'agent' | 'admin';
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  createdAt: Date;
  updatedAt: Date;
  refreshToken?: string;
}

export interface Contact {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  status: string; // Allow any string for Prisma compatibility
  comment?: string | null;
  createdAt: Date;
  updatedAt: Date;
  segments?: Segment[];
  conversations?: Conversation[];
}

export interface Campaign {
  id: string;
  name: string;
  status: string; // Allow any string for Prisma compatibility
  scheduledAt?: Date;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  readCount: number;
  clickedCount: number;
  createdAt: Date;
  updatedAt: Date;
  targetSegments?: Segment[];
  template?: Template;
  templateId: string;
}

export interface Segment {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  contacts?: Contact[];
  campaigns?: Campaign[];
}

export interface Message {
  id: string;
  whatsappId?: string;
  from: string;
  to: string;
  body?: string;
  type: string; // Allow any string for Prisma compatibility
  timestamp: Date;
  status: string; // Allow any string for Prisma compatibility
  direction: string; // Allow any string for Prisma compatibility
  createdAt: Date;
  updatedAt: Date;
  conversation?: Conversation;
  conversationId: string;
}

export interface Conversation {
  id: string;
  contact?: Contact;
  contactId: string;
  lastMessageAt: Date;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
}

export interface Template {
  id: string;
  name: string;
  content: any; // JSON structure from WhatsApp
  status: string; // Allow any string for Prisma compatibility
  createdAt: Date;
  updatedAt: Date;
  campaigns?: Campaign[];
}

export interface Webhook {
  id: string;
  event: string;
  payload: any; // JSON payload
  processed: boolean;
  createdAt: Date;
}

export interface MediaAsset {
  id: string;
  waMediaId: string;
  type: string;
  mimeType: string;
  fileName?: string;
  size?: number;
  sha256?: string;
  url?: string;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
}

export interface Configuration {
  id: string;
  organizationId?: string;
  config: any; // JSON configuration
  createdAt: Date;
  updatedAt: Date;
}
