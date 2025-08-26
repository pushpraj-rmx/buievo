// Web App Type Definitions
// This file contains web-specific type definitions and re-exports shared types

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
} from '@whatssuite/types';

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

// Web-specific types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
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
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
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

// Query parameters for web-specific queries
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

// Web-specific extensions to shared types
export interface WebContact extends Contact {
  // Additional web-specific fields
  lastActivity?: Date;
  tags?: string[];
  notes?: string;
  isFavorite?: boolean;
}

export interface WebCampaign extends Campaign {
  // Additional web-specific fields
  createdBy: string;
  approvedBy?: string;
  approvalDate?: Date;
  isPublic?: boolean;
}

export interface WebTemplate extends Template {
  // Additional web-specific fields
  createdBy: string;
  approvedBy?: string;
  approvalDate?: Date;
  usageCount: number;
  isPublic?: boolean;
  rating?: number;
  reviews?: number;
}

// Web-specific API response types
export interface WebApiResponse extends ApiResponse {
  // Additional web-specific response fields
  timestamp: string;
  requestId?: string;
  version?: string;
}

// Web-specific error types
export interface WebApiError extends ApiError {
  // Additional web-specific error fields
  timestamp: string;
  requestId?: string;
  userFriendlyMessage?: string;
  helpUrl?: string;
}

// Web-specific pagination types
export interface WebPaginationParams extends PaginationParams {
  // Additional web-specific pagination fields
  includeDeleted?: boolean;
  includeArchived?: boolean;
  sortDirection?: 'asc' | 'desc';
}

export interface WebPaginatedResponse<T> extends PaginatedResponse<T> {
  // Additional web-specific pagination fields
  hasMore: boolean;
  nextCursor?: string;
  prevCursor?: string;
  totalPages: number;
  currentPage: number;
}

// Web-specific form types
export interface WebFormField extends FormField {
  // Additional web-specific form fields
  helpText?: string;
  tooltip?: string;
  validationMessage?: string;
  autoComplete?: string;
  pattern?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface WebFormState extends FormState {
  // Additional web-specific form state fields
  isDirty: boolean;
  isPristine: boolean;
  submitCount: number;
  lastSubmittedAt?: Date;
}

// Web-specific notification types
export interface WebNotification extends Notification {
  // Additional web-specific notification fields
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'system' | 'user' | 'campaign' | 'template' | 'media' | 'analytics';
  actionUrl?: string;
  expiresAt?: Date;
}

// Web-specific theme types
export interface WebTheme extends Theme {
  // Additional web-specific theme fields
  customCSS?: string;
  customJS?: string;
  fontWeights: Record<string, number>;
  spacing: Record<string, string>;
  shadows: Record<string, string>;
  transitions: Record<string, string>;
}

// Web-specific settings types
export interface WebAppSettings extends AppSettings {
  // Additional web-specific settings fields
  features: {
    darkMode: boolean;
    notifications: boolean;
    analytics: boolean;
    socialSharing: boolean;
    exportData: boolean;
    importData: boolean;
  };
  privacy: {
    shareAnalytics: boolean;
    shareUsageData: boolean;
    allowCookies: boolean;
    allowTracking: boolean;
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    screenReader: boolean;
  };
}
