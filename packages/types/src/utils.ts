// Utility types for buievo

// Generic utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};
export type Immutable<T> = {
  readonly [P in keyof T]: T[P];
};

// Function utility types
export type AsyncFunction<T = any, R = any> = (...args: T[]) => Promise<R>;
export type SyncFunction<T = any, R = any> = (...args: T[]) => R;
export type FunctionWithContext<T = any, R = any, C = any> = (context: C, ...args: T[]) => R;
export type AsyncFunctionWithContext<T = any, R = any, C = any> = (context: C, ...args: T[]) => Promise<R>;

// Promise utility types
export type PromiseResult<T> = Promise<T>;
export type PromiseRejection<T = any> = Promise<never>;
export type PromiseSettledResult<T> = Promise<PromiseSettledResult<T>>;

// Array utility types
export type ArrayElement<T> = T extends Array<infer U> ? U : never;
export type NonEmptyArray<T> = [T, ...T[]];
export type ArrayWithLength<T, L extends number> = T[] & { length: L };

// Object utility types
export type ObjectKeys<T> = keyof T;
export type ObjectValues<T> = T[keyof T];
export type ObjectEntries<T> = [keyof T, T[keyof T]][];
export type PickByValue<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};
export type OmitByValue<T, V> = {
  [K in keyof T as T[K] extends V ? never : K]: T[K];
};

// String utility types
export type StringLiteral<T> = T extends string ? T : never;
export type StringKeys<T> = Extract<keyof T, string>;
export type StringValues<T> = T[StringKeys<T>];

// Number utility types
export type NumberLiteral<T> = T extends number ? T : never;
export type PositiveNumber = number & { __brand: 'PositiveNumber' };
export type NegativeNumber = number & { __brand: 'NegativeNumber' };
export type NonZeroNumber = number & { __brand: 'NonZeroNumber' };

// Date utility types
export type DateString = string & { __brand: 'DateString' };
export type ISODateString = string & { __brand: 'ISODateString' };
export type Timestamp = number & { __brand: 'Timestamp' };

// ID utility types
export type UUID = string & { __brand: 'UUID' };
export type ID = string | number;
export type AutoIncrementID = number & { __brand: 'AutoIncrementID' };

// Email utility types
export type Email = string & { __brand: 'Email' };
export type PhoneNumber = string & { __brand: 'PhoneNumber' };
export type URL = string & { __brand: 'URL' };

// Status utility types
export type Status = 'active' | 'inactive' | 'pending' | 'deleted';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Pagination utility types
export interface PaginationParamsUtil {
  page: number;
  limit: number;
  offset?: number;
  total?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Sorting utility types
export type SortOrder = 'asc' | 'desc';
export type SortDirection = 1 | -1;

export interface SortParams {
  sortBy: string;
  sortOrder: SortOrder;
}

export interface SortConfig {
  field: string;
  direction: SortDirection;
  nullsFirst?: boolean;
}

// Filtering utility types
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'ilike' | 'regex' | 'exists';

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface FilterParams {
  filters: FilterCondition[];
  logicalOperator?: 'and' | 'or';
}

// Search utility types
export interface SearchParams {
  query: string;
  fields?: string[];
  fuzzy?: boolean;
  highlight?: boolean;
  maxResults?: number;
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  query: string;
  highlights?: Record<string, string[]>;
}

// Validation utility types
export interface ValidationResultUtil {
  isValid: boolean;
  errors: ValidationErrorUtil[];
  warnings: ValidationWarningUtil[];
}

export interface ValidationErrorUtil {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationWarningUtil {
  field: string;
  message: string;
  code: string;
  value?: any;
}

// Result utility types
export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  success: true;
  data: T;
  error?: never;
}

export interface Failure<E> {
  success: false;
  data?: never;
  error: E;
}

// Option utility types (Maybe pattern)
export type Option<T> = Some<T> | None;

export interface Some<T> {
  type: 'some';
  value: T;
}

export interface None {
  type: 'none';
}

// Either utility types
export type Either<L, R> = Left<L> | Right<R>;

export interface Left<L> {
  type: 'left';
  value: L;
}

export interface Right<R> {
  type: 'right';
  value: R;
}

// Cache utility types
export interface CacheEntry<T> {
  key: string;
  value: T;
  ttl: number;
  createdAt: Date;
  accessedAt: Date;
  accessCount: number;
}

export interface CacheConfigUtil {
  ttl: number;
  maxSize?: number;
  cleanupInterval?: number;
  evictionPolicy?: 'lru' | 'lfu' | 'fifo';
}

// Retry utility types
export interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoff: 'fixed' | 'exponential' | 'linear';
  factor?: number;
  maxDelay?: number;
  retryableErrors?: string[];
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

// Queue utility types
export interface QueueItem<T = any> {
  id: string;
  data: T;
  priority: number;
  createdAt: Date;
  scheduledAt?: Date;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface QueueConfig {
  name: string;
  concurrency: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  maxSize?: number;
}

// Logger utility types
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  error?: Error;
  requestId?: string;
  userId?: string;
}

export interface Logger {
  error(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  debug(message: string, context?: Record<string, any>): void;
  trace(message: string, context?: Record<string, any>): void;
}

// Metrics utility types
export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  unit?: string;
}

export interface Counter extends Metric {
  type: 'counter';
}

export interface Gauge extends Metric {
  type: 'gauge';
}

export interface Histogram extends Metric {
  type: 'histogram';
  buckets: number[];
  sum: number;
  count: number;
}

// Health check utility types
export interface HealthCheck {
  name: string;
  check: () => Promise<HealthStatus>;
  timeout?: number;
  interval?: number;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  details?: Record<string, any>;
  timestamp: Date;
  responseTime?: number;
}

// Configuration utility types
export interface ConfigValue<T = any> {
  value: T;
  source: 'default' | 'environment' | 'file' | 'database';
  lastUpdated: Date;
  metadata?: Record<string, any>;
}

export interface ConfigChange<T = any> {
  key: string;
  oldValue: T;
  newValue: T;
  timestamp: Date;
  source: string;
}

// Event utility types
export interface EventMetadata {
  correlationId: string;
  causationId?: string;
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

// API utility types
export interface ApiResponseWrapper<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    version: string;
    pagination?: PaginationParamsUtil;
  };
}

// Database utility types
export interface DatabaseConnection {
  id: string;
  host: string;
  port: number;
  database: string;
  user: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastUsed: Date;
  queryCount: number;
}

export interface QueryResult<T = any> {
  data: T[];
  count: number;
  executionTime: number;
  query: string;
  params?: any[];
}

// File utility types
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: Date;
  path: string;
  hash?: string;
}

export interface FileUploadResult {
  success: boolean;
  fileId?: string;
  url?: string;
  error?: string;
  fileInfo?: FileInfo;
}

// Time utility types
export interface TimeRange {
  start: Date;
  end: Date;
}

export interface TimeWindow {
  duration: number;
  unit: 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
}

// Network utility types
export interface NetworkRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface NetworkResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  responseTime: number;
}

// Security utility types
export interface SecurityContext {
  userId?: string;
  role?: string;
  permissions?: string[];
  ip?: string;
  userAgent?: string;
  sessionId?: string;
  token?: string;
}

export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

// Utility function types
export type Predicate<T> = (value: T) => boolean;
export type Mapper<T, R> = (value: T) => R;
export type Reducer<T, R> = (accumulator: R, value: T) => R;
export type Comparator<T> = (a: T, b: T) => number;
export type Transformer<T, R> = (value: T) => R;
export type Validator<T> = (value: T) => ValidationResultUtil;
