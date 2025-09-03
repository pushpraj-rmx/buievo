// Admin Dashboard Type Definitions
// This file contains admin-specific type definitions and re-exports shared types

import type {
  ApiResponse,
  ApiError,
  PaginationParams,
  PaginatedResponse,
  Contact,
  Campaign,
  Template,
  Message,
  Conversation,
  MediaAsset,
  CreateContactRequest,
  UpdateContactRequest,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  SendMessageRequest,
  MessageResponse,
  ConversationSummary,
  UploadMediaRequest,
  MediaUploadResponse,
  ContactFilters,
  CampaignFilters,
  TemplateFilters,
  CampaignAnalytics,
  CampaignStats
} from '@buievo/types';

// Re-export shared types
export type {
  ApiResponse,
  ApiError,
  PaginationParams,
  PaginatedResponse,
  Contact,
  Campaign,
  Template,
  Message,
  Conversation,
  MediaAsset,
  CreateContactRequest,
  UpdateContactRequest,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  SendMessageRequest,
  MessageResponse,
  ConversationSummary,
  UploadMediaRequest,
  MediaUploadResponse,
  ContactFilters,
  CampaignFilters,
  TemplateFilters,
  CampaignAnalytics,
  CampaignStats
};

// Core application types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

// Navigation and UI types
export interface NavigationItem {
  id: string;
  title: string;
  href: string;
  icon?: string;
  badge?: string | number;
  children?: NavigationItem[];
  isActive?: boolean;
  isDisabled?: boolean;
  requiresPermission?: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

export interface SidebarState {
  isCollapsed: boolean;
  width: number;
  isMobile: boolean;
}

// Dashboard and analytics types
export interface DashboardStats {
  totalContacts: number;
  totalCampaigns: number;
  totalTemplates: number;
  totalMedia: number;
  activeWorkers: number;
  messagesSentToday: number;
  messagesSentThisWeek: number;
  messagesSentThisMonth: number;
  successRate: number;
  errorRate: number;
}

export interface ChartData {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  category?: string;
}

export interface AnalyticsData {
  period: 'day' | 'week' | 'month' | 'year';
  data: TimeSeriesData[];
  summary: {
    total: number;
    average: number;
    change: number;
    changePercentage: number;
  };
}

// Table and data types
export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface TableState {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filters: Record<string, unknown>;
  selectedRows: string[];
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Form and validation types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'file' | 'date' | 'time' | 'datetime';
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: unknown }[];
  validation?: ValidationRule[];
  defaultValue?: unknown;
  disabled?: boolean;
  hidden?: boolean;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'url' | 'custom';
  value?: unknown;
  message: string;
}

export interface FormState {
  values: Record<string, unknown>;
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Query parameters for admin-specific queries
export interface QueryParams extends PaginationParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

// Notification and alert types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: Date;
  isRead: boolean;
}

export interface Alert {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  dismissible?: boolean;
  autoDismiss?: boolean;
  duration?: number;
}

// Theme and styling types
export interface Theme {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  borderRadius: string;
  fontSize: string;
  fontFamily: string;
}

export interface ColorPalette {
  primary: string[];
  secondary: string[];
  success: string[];
  warning: string[];
  error: string[];
  info: string[];
  neutral: string[];
}

// Localization types
export interface Locale {
  code: string;
  name: string;
  flag?: string;
  direction: 'ltr' | 'rtl';
}

export interface LocalizationConfig {
  currentLocale: string;
  fallbackLocale: string;
  availableLocales: Locale[];
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  numberFormat: string;
}

// Settings and configuration types
export interface AppSettings {
  theme: Theme;
  localization: LocalizationConfig;
  notifications: NotificationSettings;
  security: SecuritySettings;
  performance: PerformanceSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  sound: boolean;
  desktop: boolean;
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
  };
  ipWhitelist: string[];
}

export interface PerformanceSettings {
  cacheEnabled: boolean;
  cacheDuration: number;
  lazyLoading: boolean;
  imageOptimization: boolean;
  analyticsEnabled: boolean;
}

// Error and logging types
export interface ErrorLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  stack?: string;
  context: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  category: 'navigation' | 'resource' | 'api' | 'render';
  metadata?: Record<string, unknown>;
}

// Modal and dialog types
export interface ModalConfig {
  id: string;
  title: string;
  content: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

export interface DialogState {
  isOpen: boolean;
  modalId?: string;
  data?: unknown;
}

// File and media types
export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  thumbnail?: string;
  uploadedAt: Date;
  uploadedBy: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface MediaUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  result?: FileInfo;
}

// Search and filter types
export interface SearchConfig {
  placeholder: string;
  debounceMs: number;
  minLength: number;
  maxResults: number;
  filters?: SearchFilter[];
}

export interface SearchFilter {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number' | 'boolean';
  options?: { label: string; value: unknown }[];
  defaultValue?: unknown;
}

export interface SearchResult<T = unknown> {
  items: T[];
  total: number;
  query: string;
  filters: Record<string, unknown>;
  suggestions?: string[];
}

// Export all types
export type {
  // Re-export existing types from config.ts
  WhatsAppConfig,
  StorageConfig,
  APIConfig,
  NotificationConfig,
  WorkerAreaConfig,
  ThemeConfig,
  SidebarConfig,
  AdvancedStorageConfig,
  AppConfig,
} from './config';
