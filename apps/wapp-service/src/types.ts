// Define Contact type locally to avoid import issues
export interface Contact {
  id: string;
  phone: string;
  name?: string;
  email?: string;
}

// Job processing types
export interface JobPayload {
  contactId?: string;
  phoneNumber?: string;
  templateName: string;
  params?: string[];
  buttonParams?: string[];
  imageUrl?: string;
  documentUrl?: string;
  filename?: string;
  priority?: 'low' | 'normal' | 'high';
  retryCount?: number;
  maxRetries?: number;
  scheduledAt?: string;
  expiresAt?: string;
}

export interface ProcessedJob {
  id: string;
  payload: JobPayload;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export interface JobResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryable: boolean;
  contact?: Contact;
  phoneNumber: string;
  templateName: string;
}

// Worker configuration types
export interface WorkerConfig {
  queueChannel: string;
  maxConcurrentJobs: number;
  jobTimeout: number;
  retryDelay: number;
  maxRetries: number;
  healthCheckInterval: number;
  gracefulShutdownTimeout: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface WorkerStats {
  totalJobsProcessed: number;
  successfulJobs: number;
  failedJobs: number;
  retriedJobs: number;
  averageProcessingTime: number;
  uptime: number;
  lastJobProcessed?: Date;
  isHealthy: boolean;
}

// Message queue types
export interface QueueMessage {
  id: string;
  payload: JobPayload;
  timestamp: number;
  priority: number;
  attempts: number;
}

export interface QueueStats {
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageWaitTime: number;
}

// Health check types
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: {
    redis: boolean;
    database: boolean;
    whatsapp: boolean;
    worker: boolean;
  };
  details: {
    redis?: string;
    database?: string;
    whatsapp?: string;
    worker?: string;
  };
  timestamp: Date;
}

// Error types
export interface WorkerError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
  timestamp: Date;
}

// Event types
export interface WorkerEvent {
  type: 'job_started' | 'job_completed' | 'job_failed' | 'job_retrying' | 'worker_started' | 'worker_stopped' | 'health_check';
  data: Record<string, unknown>;
  timestamp: Date;
}

// Template message types
export interface TemplateMessageData {
  to: string;
  templateName: string;
  bodyParams?: string[];
  buttonParams?: string[];
  imageUrl?: string;
  documentUrl?: string;
  filename?: string;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Metrics types
export interface WorkerMetrics {
  jobsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
}

// Configuration environment types
export interface EnvironmentConfig {
  NODE_ENV: string;
  REDIS_URL: string;
  DATABASE_URL: string;
  WHATSAPP_API_URL: string;
  WHATSAPP_API_TOKEN: string;
  WORKER_MAX_CONCURRENT_JOBS?: string;
  WORKER_JOB_TIMEOUT?: string;
  WORKER_RETRY_DELAY?: string;
  WORKER_MAX_RETRIES?: string;
  WORKER_HEALTH_CHECK_INTERVAL?: string;
  WORKER_LOG_LEVEL?: string;
}
