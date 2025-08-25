import "dotenv/config";
import { redis } from "@whatssuite/redis";
import { prisma } from "@whatssuite/db";
import {
  wappClient,
  type SendTemplateMessageArgs,
} from "@whatssuite/wapp-client";

// Import new modular components
import { logger } from './logger';
import { 
  WappServiceError,
  JobProcessingError,
  ContactNotFoundError,
  PhoneNumberNotFoundError,
  InvalidPhoneNumberError,
  WhatsAppApiError,
  MessageParseError,
  createErrorFromWhatsAppResponse,
  createErrorFromNetworkError,
  createErrorFromDatabaseError,
  createErrorFromRedisError,
  isRetryableError
} from './errors';
import { 
  createConfig,
  validateEnvironment,
  getEnvironmentConfig
} from './config';
import { 
  validateJobPayload,
  validateTemplateMessageData,
  sanitizeJobPayload,
  validateJsonString
} from './validation';
import type { 
  JobPayload,
  JobResult,
  ProcessedJob,
  WorkerStats,
  TemplateMessageData,
  ValidationResult,
  Contact
} from './types';

// Load and validate configuration
let config: ReturnType<typeof createConfig>;
try {
  config = createConfig();
  logger.logWorkerStartup(config as unknown as Record<string, unknown>);
} catch (error) {
  console.error('Failed to load configuration:', error);
  process.exit(1);
}

// Validate environment
const envErrors = validateEnvironment();
if (envErrors.length > 0) {
  console.error('Environment validation failed:', envErrors.join('\n'));
  process.exit(1);
}

const MESSAGE_QUEUE_CHANNEL = config.queueChannel;

// Worker statistics
let workerStats: WorkerStats = {
  totalJobsProcessed: 0,
  successfulJobs: 0,
  failedJobs: 0,
  retriedJobs: 0,
  averageProcessingTime: 0,
  uptime: 0,
  isHealthy: true,
};

const startTime = Date.now();

// Update worker stats
function updateWorkerStats(duration: number, success: boolean, retried: boolean = false): void {
  workerStats.totalJobsProcessed++;
  workerStats.uptime = Date.now() - startTime;
  
  if (success) {
    workerStats.successfulJobs++;
  } else {
    workerStats.failedJobs++;
  }
  
  if (retried) {
    workerStats.retriedJobs++;
  }
  
  // Update average processing time
  const totalTime = workerStats.averageProcessingTime * (workerStats.totalJobsProcessed - 1) + duration;
  workerStats.averageProcessingTime = totalTime / workerStats.totalJobsProcessed;
  
  workerStats.lastJobProcessed = new Date();
}

// Health check function
async function performHealthCheck(): Promise<boolean> {
  try {
    // Check Redis connection
    await redis.ping();
    
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check WhatsApp API (basic connectivity)
    // This could be enhanced with actual API health check
    
    workerStats.isHealthy = true;
    logger.logHealthCheck({
      redis: true,
      database: true,
      whatsapp: true,
      worker: true
    });
    
    return true;
  } catch (error) {
    workerStats.isHealthy = false;
    logger.error('Health check failed', {
      operation: 'health_check',
      error: (error as Error).message
    });
    return false;
  }
}

// Process a single job
async function processJob(jobData: string): Promise<JobResult> {
  const jobStartTime = Date.now();
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Validate JSON format
    const jsonValidation = validateJsonString(jobData);
    if (!jsonValidation.isValid) {
      throw new MessageParseError(`Invalid JSON format: ${jsonValidation.errors.join(', ')}`, {
        jobData,
        errors: jsonValidation.errors
      });
    }

    // Parse and validate job payload
    const rawPayload: JobPayload = JSON.parse(jobData);
    const sanitizedPayload = sanitizeJobPayload(rawPayload);
    
    logger.logJobReceived(jobId, sanitizedPayload);
    
    const validation = validateJobPayload(sanitizedPayload);
    if (!validation.isValid) {
      logger.logValidationError(jobId, validation.errors);
      throw new JobProcessingError(`Job validation failed: ${validation.errors.join(', ')}`, false, {
        jobId,
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    if (validation.warnings.length > 0) {
      logger.warn('Job validation warnings', {
        jobId,
        warnings: validation.warnings
      });
    }

    logger.logJobStarted(jobId, sanitizedPayload);

    // Determine phone number
    let phoneNumber: string;
    let contact: Contact | undefined = undefined;

    if (sanitizedPayload.contactId) {
      try {
        const dbContact = await prisma.contact.findUnique({
          where: { id: sanitizedPayload.contactId },
          select: { id: true, phone: true, name: true, email: true },
        });
        
        if (dbContact) {
          contact = {
            id: dbContact.id,
            phone: dbContact.phone,
            name: dbContact.name || undefined,
            email: dbContact.email || undefined,
          } as Contact;
        } else {
          contact = undefined;
        }
        
        if (!contact) {
          throw new ContactNotFoundError(sanitizedPayload.contactId, { jobId });
        }
        
        if (!contact.phone) {
          throw new PhoneNumberNotFoundError(sanitizedPayload.contactId, { jobId });
        }
        
        phoneNumber = contact.phone;
        logger.logContactLookup(sanitizedPayload.contactId, phoneNumber);
        
      } catch (error) {
        if (error instanceof WappServiceError) {
          throw error;
        }
        throw createErrorFromDatabaseError(error as Error, 'contact_lookup');
      }
    } else if (sanitizedPayload.phoneNumber) {
      phoneNumber = sanitizedPayload.phoneNumber;
    } else {
      throw new JobProcessingError('No contactId or phoneNumber provided in job', false, { jobId });
    }

    // Validate phone number
    const phoneValidation = validatePhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      throw new InvalidPhoneNumberError(phoneNumber, { 
        jobId,
        errors: phoneValidation.errors 
      });
    }

    // Prepare template message data
    const templateData: TemplateMessageData = {
      to: phoneNumber,
      templateName: sanitizedPayload.templateName,
      bodyParams: sanitizedPayload.params,
      buttonParams: sanitizedPayload.buttonParams,
      imageUrl: sanitizedPayload.imageUrl,
      documentUrl: sanitizedPayload.documentUrl,
      filename: sanitizedPayload.filename,
    };

    // Validate template message data
    const templateValidation = validateTemplateMessageData(templateData);
    if (!templateValidation.isValid) {
      throw new JobProcessingError(`Template validation failed: ${templateValidation.errors.join(', ')}`, false, {
        jobId,
        errors: templateValidation.errors
      });
    }

    logger.logWhatsAppApiCall(sanitizedPayload.templateName, phoneNumber);

    // Send template message
    let messageId: string;
    try {
      const result = await wappClient.sendTemplateMessage(templateData as SendTemplateMessageArgs);
      messageId = (result as any).messageId || 'unknown';
      
      logger.logWhatsAppApiSuccess(sanitizedPayload.templateName, phoneNumber, messageId);
      
    } catch (error) {
      const isRetryable = error instanceof Error && (
        error.message.includes('timeout') ||
        error.message.includes('network') ||
        error.message.includes('rate limit')
      );
      
      logger.logWhatsAppApiError(sanitizedPayload.templateName, phoneNumber, (error as Error).message, isRetryable);
      
      if (error instanceof Error) {
        throw createErrorFromNetworkError(error, 'whatsapp_api_call');
      }
      throw new WhatsAppApiError('Unknown WhatsApp API error', false, { jobId });
    }

    const duration = Date.now() - jobStartTime;
    const result: JobResult = {
      success: true,
      messageId,
      contact,
      phoneNumber,
      templateName: sanitizedPayload.templateName,
      retryable: false,
    };

    logger.logJobCompleted(jobId, result, duration);
    updateWorkerStats(duration, true);
    
    return result;

  } catch (error) {
    const duration = Date.now() - jobStartTime;
    const isRetryable = error instanceof WappServiceError ? isRetryableError(error) : false;
    
    logger.logJobFailed(jobId, (error as Error).message, isRetryable);
    updateWorkerStats(duration, false);
    
    const result: JobResult = {
      success: false,
      error: (error as Error).message,
      retryable: isRetryable,
      phoneNumber: 'unknown',
      templateName: 'unknown',
    };
    
    return result;
  }
}

// Enhanced worker with health checks and graceful shutdown
async function startWorker(): Promise<void> {
  logger.info('🚀 WhatsApp Service Worker starting up', {
    operation: 'startup',
    config: Object.keys(config)
  });

  try {
    // Initial health check
    const isHealthy = await performHealthCheck();
    if (!isHealthy) {
      throw new Error('Initial health check failed');
    }

    const subscriber = redis.duplicate();
    await subscriber.connect();
    logger.logRedisConnection('connected');

    // Set up periodic health checks
    const healthCheckInterval = setInterval(async () => {
      await performHealthCheck();
    }, config.healthCheckInterval);

    // Set up periodic stats logging
    const statsInterval = setInterval(() => {
      logger.logWorkerStats(workerStats);
    }, 300000); // Every 5 minutes

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      logger.logWorkerShutdown(`Received ${signal}`);
      
      clearInterval(healthCheckInterval);
      clearInterval(statsInterval);
      
      // Wait for ongoing jobs to complete
      setTimeout(async () => {
        try {
          await subscriber.disconnect();
          await prisma.$disconnect();
          logger.info('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('❌ Error during shutdown', {
            operation: 'shutdown',
            error: (error as Error).message
          });
          process.exit(1);
        }
      }, config.gracefulShutdownTimeout);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Message listener
    const messageListener = async (message: string, channel: string) => {
      if (channel === MESSAGE_QUEUE_CHANNEL) {
        logger.info(`📨 Received job from ${channel}`, {
          operation: 'message_received',
          channel
        });
        
        try {
          await processJob(message);
        } catch (error) {
          logger.error('❌ Failed to process job', {
            operation: 'job_processing_error',
            error: (error as Error).message
          });
        }
      }
    };

    // Subscribe to the channel
    await subscriber.subscribe(MESSAGE_QUEUE_CHANNEL, messageListener);
    logger.info(`✅ Subscribed to ${MESSAGE_QUEUE_CHANNEL}. Waiting for jobs...`, {
      operation: 'subscription',
      channel: MESSAGE_QUEUE_CHANNEL
    });

  } catch (error) {
    logger.error('❌ Failed to start worker', {
      operation: 'startup_error',
      error: (error as Error).message
    });
    process.exit(1);
  }
}

// Helper function for phone number validation (imported from validation)
function validatePhoneNumber(phoneNumber: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!phoneNumber) {
    errors.push('Phone number is required');
    return { isValid: false, errors, warnings };
  }

  // Remove any non-digit characters except + and -
  const cleaned = phoneNumber.replace(/[^\d+\-]/g, '');
  
  if (cleaned.length < 10) {
    errors.push('Phone number must be at least 10 digits');
  }

  if (cleaned.length > 20) {
    errors.push('Phone number must not exceed 20 characters');
  }

  // Check for valid international format
  if (!cleaned.startsWith('+') && !cleaned.startsWith('1') && !cleaned.startsWith('91')) {
    warnings.push('Phone number should be in international format (e.g., +1234567890)');
  }

  // Check for consecutive digits (at least 7 digits)
  const digitCount = cleaned.replace(/\D/g, '').length;
  if (digitCount < 7) {
    errors.push('Phone number must contain at least 7 digits');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Start the worker
startWorker().catch((error) => {
  logger.error('❌ Worker startup failed', {
    operation: 'startup_failure',
    error: (error as Error).message
  });
  process.exit(1);
});

// Export for testing
export {
  processJob,
  performHealthCheck,
  workerStats,
  config,
  validateJobPayload,
  validateTemplateMessageData,
  sanitizeJobPayload,
};
