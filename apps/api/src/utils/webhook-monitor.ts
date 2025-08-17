// Webhook monitoring utility
import { Request, Response } from "express";
import { webhookLogger } from "./logger";

export const logWebhookRequest = (req: Request, res: Response, next: any) => {
  const timestamp = new Date().toISOString();
  
  webhookLogger.info('🔍 Webhook Request Details', {
    timestamp,
    method: req.method,
    url: req.url,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
      'x-hub-signature': req.headers['x-hub-signature'],
      'x-hub-signature-256': req.headers['x-hub-signature-256']
    },
    query: req.query,
    body: req.body,
    bodySize: req.body ? JSON.stringify(req.body).length : 0,
    ip: req.ip,
    forwardedFor: req.headers['x-forwarded-for'],
    realIp: req.headers['x-real-ip']
  });

  // Log specific webhook events
  if (req.method === 'POST' && req.body) {
    const { object, entry } = req.body;
    
    if (object === 'whatsapp_business_account' && entry) {
      entry.forEach((entryItem: any, index: number) => {
        webhookLogger.info(`📨 Webhook Entry ${index + 1}`, {
          entryId: entryItem.id,
          time: entryItem.time,
          changesCount: entryItem.changes?.length || 0
        });

        entryItem.changes?.forEach((change: any, changeIndex: number) => {
          webhookLogger.info(`🔄 Webhook Change ${changeIndex + 1}`, {
            field: change.field,
            value: {
              messagingProduct: change.value.messaging_product,
              metadata: change.value.metadata,
              messagesCount: change.value.messages?.length || 0,
              statusesCount: change.value.statuses?.length || 0
            }
          });

          // Log individual messages
          change.value.messages?.forEach((message: any, msgIndex: number) => {
            webhookLogger.info(`💬 Incoming Message ${msgIndex + 1}`, {
              messageId: message.id,
              from: message.from,
              timestamp: message.timestamp,
              type: message.type,
              hasText: !!message.text,
              hasImage: !!message.image,
              hasDocument: !!message.document
            });
          });

          // Log status updates
          change.value.statuses?.forEach((status: any, statusIndex: number) => {
            webhookLogger.info(`📊 Status Update ${statusIndex + 1}`, {
              messageId: status.id,
              status: status.status,
              timestamp: status.timestamp,
              recipientId: status.recipient_id
            });
          });
        });
      });
    }
  }

  next();
};

export const validateWebhookSignature = (req: Request, res: Response, next: any) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  
  if (!signature) {
    webhookLogger.warn('⚠️ Missing webhook signature', {
      headers: req.headers
    });
  } else {
    webhookLogger.info('✅ Webhook signature present', {
      signature: signature.substring(0, 20) + '...'
    });
  }

  next();
};
