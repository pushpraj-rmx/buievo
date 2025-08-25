// Event types for WhatsSuite

// Base event interface
export interface BaseEvent {
  id: string;
  type: string;
  timestamp: Date;
  source: string;
  version: string;
  metadata?: Record<string, any>;
}

// Event payload types
export type EventPayload = Record<string, any>;

// Event handler function type
export type EventHandler<T = EventPayload> = (event: BaseEvent & { payload: T }) => Promise<void> | void;

// Event emitter interface
export interface EventEmitter {
  emit<T = EventPayload>(eventType: string, payload: T): void;
  on<T = EventPayload>(eventType: string, handler: EventHandler<T>): void;
  off(eventType: string, handler: EventHandler): void;
  once<T = EventPayload>(eventType: string, handler: EventHandler<T>): void;
  removeAllListeners(eventType?: string): void;
  listenerCount(eventType: string): number;
}

// User events
export interface UserCreatedEvent extends BaseEvent {
  type: 'user.created';
  payload: {
    userId: string;
    email: string;
    role: 'agent' | 'admin';
    createdAt: Date;
  };
}

export interface UserUpdatedEvent extends BaseEvent {
  type: 'user.updated';
  payload: {
    userId: string;
    email: string;
    role: 'agent' | 'admin';
    updatedAt: Date;
    changes: Record<string, any>;
  };
}

export interface UserDeletedEvent extends BaseEvent {
  type: 'user.deleted';
  payload: {
    userId: string;
    email: string;
    deletedAt: Date;
  };
}

export interface UserLoggedInEvent extends BaseEvent {
  type: 'user.logged_in';
  payload: {
    userId: string;
    email: string;
    ip: string;
    userAgent: string;
    timestamp: Date;
  };
}

export interface UserLoggedOutEvent extends BaseEvent {
  type: 'user.logged_out';
  payload: {
    userId: string;
    email: string;
    timestamp: Date;
  };
}

// Contact events
export interface ContactCreatedEvent extends BaseEvent {
  type: 'contact.created';
  payload: {
    contactId: string;
    name: string;
    email?: string;
    phone: string;
    status: string;
    createdAt: Date;
  };
}

export interface ContactUpdatedEvent extends BaseEvent {
  type: 'contact.updated';
  payload: {
    contactId: string;
    name: string;
    email?: string;
    phone: string;
    status: string;
    updatedAt: Date;
    changes: Record<string, any>;
  };
}

export interface ContactDeletedEvent extends BaseEvent {
  type: 'contact.deleted';
  payload: {
    contactId: string;
    name: string;
    deletedAt: Date;
  };
}

export interface ContactAddedToSegmentEvent extends BaseEvent {
  type: 'contact.added_to_segment';
  payload: {
    contactId: string;
    segmentId: string;
    segmentName: string;
    timestamp: Date;
  };
}

export interface ContactRemovedFromSegmentEvent extends BaseEvent {
  type: 'contact.removed_from_segment';
  payload: {
    contactId: string;
    segmentId: string;
    segmentName: string;
    timestamp: Date;
  };
}

// Campaign events
export interface CampaignCreatedEvent extends BaseEvent {
  type: 'campaign.created';
  payload: {
    campaignId: string;
    name: string;
    status: string;
    templateId: string;
    targetSegmentIds: string[];
    scheduledAt?: Date;
    createdAt: Date;
  };
}

export interface CampaignUpdatedEvent extends BaseEvent {
  type: 'campaign.updated';
  payload: {
    campaignId: string;
    name: string;
    status: string;
    updatedAt: Date;
    changes: Record<string, any>;
  };
}

export interface CampaignStartedEvent extends BaseEvent {
  type: 'campaign.started';
  payload: {
    campaignId: string;
    name: string;
    startedAt: Date;
    targetContactCount: number;
  };
}

export interface CampaignCompletedEvent extends BaseEvent {
  type: 'campaign.completed';
  payload: {
    campaignId: string;
    name: string;
    completedAt: Date;
    sentCount: number;
    deliveredCount: number;
    failedCount: number;
    readCount: number;
  };
}

export interface CampaignPausedEvent extends BaseEvent {
  type: 'campaign.paused';
  payload: {
    campaignId: string;
    name: string;
    pausedAt: Date;
    reason?: string;
  };
}

// Template events
export interface TemplateCreatedEvent extends BaseEvent {
  type: 'template.created';
  payload: {
    templateId: string;
    name: string;
    category: string;
    language: string;
    status: string;
    createdAt: Date;
  };
}

export interface TemplateUpdatedEvent extends BaseEvent {
  type: 'template.updated';
  payload: {
    templateId: string;
    name: string;
    status: string;
    updatedAt: Date;
    changes: Record<string, any>;
  };
}

export interface TemplateApprovedEvent extends BaseEvent {
  type: 'template.approved';
  payload: {
    templateId: string;
    name: string;
    approvedAt: Date;
    approvedBy: string;
  };
}

export interface TemplateRejectedEvent extends BaseEvent {
  type: 'template.rejected';
  payload: {
    templateId: string;
    name: string;
    rejectedAt: Date;
    rejectedBy: string;
    reason: string;
  };
}

// Message events
export interface MessageSentEvent extends BaseEvent {
  type: 'message.sent';
  payload: {
    messageId: string;
    conversationId: string;
    contactId: string;
    contactName: string;
    content: string;
    type: string;
    direction: 'outbound';
    timestamp: Date;
    whatsappId?: string;
  };
}

export interface MessageReceivedEvent extends BaseEvent {
  type: 'message.received';
  payload: {
    messageId: string;
    conversationId: string;
    contactId: string;
    contactName: string;
    content: string;
    type: string;
    direction: 'inbound';
    timestamp: Date;
    whatsappId: string;
  };
}

export interface MessageDeliveredEvent extends BaseEvent {
  type: 'message.delivered';
  payload: {
    messageId: string;
    whatsappId: string;
    timestamp: Date;
    recipientId: string;
  };
}

export interface MessageReadEvent extends BaseEvent {
  type: 'message.read';
  payload: {
    messageId: string;
    whatsappId: string;
    timestamp: Date;
    recipientId: string;
  };
}

export interface MessageFailedEvent extends BaseEvent {
  type: 'message.failed';
  payload: {
    messageId: string;
    whatsappId?: string;
    timestamp: Date;
    error: string;
    errorCode?: string;
    retryable: boolean;
  };
}

// Conversation events
export interface ConversationCreatedEvent extends BaseEvent {
  type: 'conversation.created';
  payload: {
    conversationId: string;
    contactId: string;
    contactName: string;
    createdAt: Date;
  };
}

export interface ConversationArchivedEvent extends BaseEvent {
  type: 'conversation.archived';
  payload: {
    conversationId: string;
    contactId: string;
    contactName: string;
    archivedAt: Date;
    archivedBy: string;
  };
}

export interface ConversationUnarchivedEvent extends BaseEvent {
  type: 'conversation.unarchived';
  payload: {
    conversationId: string;
    contactId: string;
    contactName: string;
    unarchivedAt: Date;
    unarchivedBy: string;
  };
}

// Media events
export interface MediaUploadedEvent extends BaseEvent {
  type: 'media.uploaded';
  payload: {
    mediaId: string;
    fileName: string;
    type: string;
    size: number;
    mimeType: string;
    url: string;
    uploadedAt: Date;
    uploadedBy: string;
  };
}

export interface MediaDeletedEvent extends BaseEvent {
  type: 'media.deleted';
  payload: {
    mediaId: string;
    fileName: string;
    deletedAt: Date;
    deletedBy: string;
  };
}

// Webhook events
export interface WebhookReceivedEvent extends BaseEvent {
  type: 'webhook.received';
  payload: {
    webhookId: string;
    source: string;
    eventType: string;
    payload: any;
    receivedAt: Date;
    signature?: string;
  };
}

export interface WebhookProcessedEvent extends BaseEvent {
  type: 'webhook.processed';
  payload: {
    webhookId: string;
    source: string;
    eventType: string;
    processedAt: Date;
    success: boolean;
    error?: string;
  };
}

// System events
export interface SystemStartupEvent extends BaseEvent {
  type: 'system.startup';
  payload: {
    version: string;
    environment: string;
    timestamp: Date;
    uptime: number;
  };
}

export interface SystemShutdownEvent extends BaseEvent {
  type: 'system.shutdown';
  payload: {
    version: string;
    environment: string;
    timestamp: Date;
    uptime: number;
    reason: string;
  };
}

export interface SystemErrorEvent extends BaseEvent {
  type: 'system.error';
  payload: {
    error: string;
    stack?: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
    context?: Record<string, any>;
  };
}

// Event bus interface
export interface EventBus extends EventEmitter {
  publish<T = EventPayload>(event: BaseEvent & { payload: T }): Promise<void>;
  subscribe<T = EventPayload>(eventType: string, handler: EventHandler<T>): void;
  unsubscribe(eventType: string, handler: EventHandler): void;
  publishAsync<T = EventPayload>(event: BaseEvent & { payload: T }): Promise<void>;
  publishBatch<T = EventPayload>(events: Array<BaseEvent & { payload: T }>): Promise<void>;
}

// Event store interface
export interface EventStore {
  append(event: BaseEvent): Promise<void>;
  getEvents(aggregateId: string, fromVersion?: number): Promise<BaseEvent[]>;
  getEventsByType(eventType: string, limit?: number): Promise<BaseEvent[]>;
  getEventsByTimeRange(from: Date, to: Date): Promise<BaseEvent[]>;
  getLastEvent(aggregateId: string): Promise<BaseEvent | null>;
  getEventCount(aggregateId: string): Promise<number>;
}

// Event replay interface
export interface EventReplay {
  replayEvents(fromDate: Date, toDate: Date, eventTypes?: string[]): Promise<void>;
  replayEventsForAggregate(aggregateId: string, fromVersion?: number): Promise<void>;
  replayEventsByType(eventType: string, limit?: number): Promise<void>;
}

// Event types union
export type WhatsSuiteEvent =
  | UserCreatedEvent
  | UserUpdatedEvent
  | UserDeletedEvent
  | UserLoggedInEvent
  | UserLoggedOutEvent
  | ContactCreatedEvent
  | ContactUpdatedEvent
  | ContactDeletedEvent
  | ContactAddedToSegmentEvent
  | ContactRemovedFromSegmentEvent
  | CampaignCreatedEvent
  | CampaignUpdatedEvent
  | CampaignStartedEvent
  | CampaignCompletedEvent
  | CampaignPausedEvent
  | TemplateCreatedEvent
  | TemplateUpdatedEvent
  | TemplateApprovedEvent
  | TemplateRejectedEvent
  | MessageSentEvent
  | MessageReceivedEvent
  | MessageDeliveredEvent
  | MessageReadEvent
  | MessageFailedEvent
  | ConversationCreatedEvent
  | ConversationArchivedEvent
  | ConversationUnarchivedEvent
  | MediaUploadedEvent
  | MediaDeletedEvent
  | WebhookReceivedEvent
  | WebhookProcessedEvent
  | SystemStartupEvent
  | SystemShutdownEvent
  | SystemErrorEvent;

// Event type registry
export interface EventTypeRegistry {
  register<T extends BaseEvent>(eventType: string, eventClass: new () => T): void;
  get<T extends BaseEvent>(eventType: string): new () => T | undefined;
  has(eventType: string): boolean;
  list(): string[];
}

// Event serializer interface
export interface EventSerializer {
  serialize(event: BaseEvent): string;
  deserialize(data: string): BaseEvent;
  canSerialize(event: BaseEvent): boolean;
}

// Event validator interface
export interface EventValidator {
  validate(event: BaseEvent): boolean;
  validatePayload(eventType: string, payload: EventPayload): boolean;
  getValidationErrors(event: BaseEvent): string[];
}
