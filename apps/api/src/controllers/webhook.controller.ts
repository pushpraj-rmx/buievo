import { Request, Response } from "express";
import { prisma } from "@whatssuite/db";
import { webhookLogger, generateRequestId, createRequestLogger } from "../utils/logger";
import { webhookMonitor } from "../utils/webhook-status";

export const handleWebhook = async (req: Request, res: Response) => {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId, 'WEBHOOK');
  
  logger.info('Webhook request received', {
    method: req.method,
    url: req.url,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length']
    },
    query: req.query,
    bodySize: req.body ? JSON.stringify(req.body).length : 0
  });

  try {
    // Handle webhook verification (GET request)
    if (req.method === "GET" && req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"]) {
      logger.info('Processing webhook verification request', {
        mode: req.query["hub.mode"],
        verifyToken: req.query["hub.verify_token"],
        challenge: req.query["hub.challenge"]
      });

      const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN;
      const challenge = req.query["hub.challenge"];

      if (req.query["hub.verify_token"] === verifyToken) {
        logger.info('Webhook verification successful', { challenge });
        webhookMonitor.setVerificationStatus('verified');
        res.status(200).send(challenge);
        return;
      } else {
        logger.warn('Webhook verification failed - invalid token', {
          providedToken: req.query["hub.verify_token"],
          expectedToken: verifyToken ? '***' : 'NOT_SET'
        });
        res.status(403).send("Forbidden");
        return;
      }
    }

    // Handle incoming messages and status updates (POST request)
    if (req.method === "POST") {
      const { body } = req;
      
      // Record webhook received
      webhookMonitor.recordWebhookReceived();
      logger.info('Webhook received and recorded', {
        object: body.object,
        entryCount: body.entry?.length || 0
      });
      
      logger.info('Processing POST webhook', {
        object: body.object,
        entryCount: body.entry?.length || 0
      });
      
      if (body.object === "whatsapp_business_account") {
        for (const entry of body.entry) {
          logger.debug('Processing webhook entry', {
            id: entry.id,
            time: entry.time,
            changesCount: entry.changes?.length || 0
          });

          for (const change of entry.changes) {
            logger.debug('Processing webhook change', {
              field: change.field,
              value: {
                messagingProduct: change.value.messaging_product,
                metadata: change.value.metadata,
                messagesCount: change.value.messages?.length || 0,
                statusesCount: change.value.statuses?.length || 0
              }
            });

            if (change.value.messages) {
              logger.info('Processing incoming messages', {
                count: change.value.messages.length,
                messages: change.value.messages.map((m: any) => ({
                  id: m.id,
                  from: m.from,
                  type: m.type,
                  hasText: !!m.text
                }))
              });
              
              // Handle incoming messages
              for (const message of change.value.messages) {
                logger.info('Starting to process message', {
                  messageId: message.id,
                  from: message.from,
                  type: message.type,
                  fullMessage: JSON.stringify(message)
                });
                await handleIncomingMessage(message, logger);
              }
            }

            if (change.value.statuses) {
              logger.info('Processing status updates', {
                count: change.value.statuses.length
              });
              
              // Handle message status updates
              for (const status of change.value.statuses) {
                await handleStatusUpdate(status, logger);
              }
            }
          }
        }
      } else {
        logger.warn('Unknown webhook object type', { object: body.object });
      }
    }

    logger.info('Webhook processing completed successfully');
    res.status(200).send("OK");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Webhook processing failed', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    webhookMonitor.recordWebhookError(errorMessage);
    res.status(500).send("Internal Server Error");
  }
};

// Test endpoint to simulate receiving a message
export const testReceiveMessage = async (req: Request, res: Response) => {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId, 'TEST_WEBHOOK');
  
  logger.info('Test receive message request', {
    body: req.body,
    headers: req.headers
  });

  try {
    const { contactId, message } = req.body;
    
    if (!contactId || !message) {
      logger.warn('Test receive message - missing required fields', {
        contactId: !!contactId,
        message: !!message
      });
      return res.status(400).json({ error: "contactId and message are required" });
    }

    // Get contact
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      logger.warn('Test receive message - contact not found', { contactId });
      return res.status(404).json({ error: "Contact not found" });
    }

    logger.info('Found contact for test message', {
      contactId: contact.id,
      contactPhone: contact.phone,
      contactName: contact.name
    });

    // Simulate incoming message
    const mockMessage = {
      from: contact.phone,
      id: `test_${Date.now()}`,
      timestamp: Math.floor(Date.now() / 1000).toString(),
      type: "text",
      text: { body: message },
    };

    logger.info('Simulating incoming message', {
      messageId: mockMessage.id,
      from: mockMessage.from,
      message: mockMessage.text.body
    });

    await handleIncomingMessage(mockMessage, logger);
    
    logger.info('Test message processed successfully');
    res.json({ success: true, message: "Test message received" });
  } catch (error) {
    logger.error('Test receive message failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ error: "Internal server error" });
  }
};

async function handleIncomingMessage(message: any, logger: any) {
  logger.info('Processing incoming message', {
    whatsappId: message.id,
    from: message.from,
    type: message.type,
    timestamp: message.timestamp,
    hasText: !!message.text,
    hasImage: !!message.image,
    hasDocument: !!message.document
  });

  try {
    const { from, id, timestamp, type, text, image, document } = message;
    
    logger.info('Message data extracted', {
      from,
      id,
      timestamp,
      type,
      hasText: !!text,
      hasImage: !!image,
      hasDocument: !!document
    });

    // Find or create contact
    let contact = await prisma.contact.findUnique({
      where: { phone: from },
    });

    if (!contact) {
      logger.info('Creating new contact', { phone: from });
      
      // Create contact if not exists
      contact = await prisma.contact.create({
        data: {
          name: `WhatsApp User (${from})`,
          phone: from,
          status: "active",
        },
      });
      logger.info('Contact created successfully', {
        contactId: contact.id,
        name: contact.name,
        phone: contact.phone
      });
    } else {
      logger.debug('Found existing contact', {
        contactId: contact.id,
        name: contact.name,
        phone: contact.phone
      });
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: { contactId: contact.id },
    });

    if (!conversation) {
      logger.info('Creating new conversation', { contactId: contact.id });
      
      conversation = await prisma.conversation.create({
        data: { contactId: contact.id },
      });
      logger.info('Conversation created successfully', {
        conversationId: conversation.id,
        contactId: conversation.contactId
      });
    } else {
      logger.debug('Found existing conversation', {
        conversationId: conversation.id,
        contactId: conversation.contactId
      });
    }

    // Determine message content and type
    let content = "";
    let messageType = "text";

    if (type === "text" && text) {
      content = text.body;
      logger.debug('Processing text message', { content: content.substring(0, 100) });
    } else if (type === "image" && image) {
      content = image.caption || "Image";
      messageType = "image";
      logger.debug('Processing image message', { 
        caption: image.caption,
        mimeType: image.mime_type,
        sha256: image.sha256,
        id: image.id
      });
    } else if (type === "document" && document) {
      content = document.caption || document.filename || "Document";
      messageType = "document";
      logger.debug('Processing document message', {
        filename: document.filename,
        caption: document.caption,
        mimeType: document.mime_type,
        sha256: document.sha256,
        id: document.id
      });
    } else {
      content = `[${type} message]`;
      messageType = type;
      logger.debug('Processing unknown message type', { type, content });
    }

    // Check if message already exists to handle duplicate webhooks
    logger.info('Checking for existing message', { whatsappId: id });
    
    let dbMessage = await prisma.message.findUnique({
      where: { whatsappId: id },
    });

    if (dbMessage) {
      logger.info('Message already exists, skipping duplicate', {
        whatsappId: id,
        dbMessageId: dbMessage.id
      });
    } else {
      logger.info('Creating new message in database', {
        whatsappId: id,
        from,
        content: content.substring(0, 100),
        type: messageType,
        conversationId: conversation.id
      });
      
      // Store the message
      dbMessage = await prisma.message.create({
        data: {
          whatsappId: id,
          from,
          to: "business",
          body: content,
          type: messageType,
          timestamp: new Date(parseInt(timestamp) * 1000),
          status: "delivered",
          direction: "inbound",
          conversationId: conversation.id,
        },
      });

      logger.info('Message stored in database successfully', {
        dbMessageId: dbMessage.id,
        whatsappId: dbMessage.whatsappId,
        type: dbMessage.type,
        direction: dbMessage.direction,
        status: dbMessage.status
      });

      // Update conversation's last message timestamp and increment unread count
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(parseInt(timestamp) * 1000),
          unreadCount: {
            increment: 1,
          },
        },
      });

      logger.info('Conversation updated', {
        conversationId: conversation.id,
        lastMessageAt: new Date(parseInt(timestamp) * 1000),
        unreadCountIncremented: true
      });
    }

    logger.info('Incoming message processing completed', {
      dbMessageId: dbMessage.id,
      whatsappId: id,
      from,
      type: messageType
    });
  } catch (error) {
    logger.error('Failed to process incoming message', {
      whatsappId: message.id,
      from: message.from,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Record the error in webhook monitor
    webhookMonitor.recordWebhookError(`Message processing failed: ${error instanceof Error ? error.message : String(error)}`);
    
    // Also log to console for immediate visibility
    console.error('WEBHOOK ERROR:', {
      whatsappId: message.id,
      from: message.from,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handleStatusUpdate(status: any, logger: any) {
  logger.info('Processing status update', {
    whatsappId: status.id,
    status: status.status,
    timestamp: status.timestamp,
    recipientId: status.recipient_id
  });

  try {
    const { id, status: messageStatus, timestamp } = status;

    // Find message by WhatsApp ID and update status
    const updateResult = await prisma.message.updateMany({
      where: { whatsappId: id },
      data: {
        status: messageStatus,
        updatedAt: new Date(parseInt(timestamp) * 1000),
      },
    });

    logger.info('Status update processed', {
      whatsappId: id,
      newStatus: messageStatus,
      recordsUpdated: updateResult.count,
      timestamp: new Date(parseInt(timestamp) * 1000)
    });

    if (updateResult.count === 0) {
      logger.warn('No message found for status update', { whatsappId: id });
    }
  } catch (error) {
    logger.error('Failed to process status update', {
      whatsappId: status.id,
      status: status.status,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
