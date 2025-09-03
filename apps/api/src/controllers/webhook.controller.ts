import { Request, Response } from "express";
import { prisma } from "@buievo/db";
import {
  webhookLogger,
  generateRequestId,
  createRequestLogger,
} from "../utils/logger";
import { webhookMonitor } from "../utils/webhook-status";
import type { 
  WhatsAppWebhookPayload,
  WhatsAppWebhookMessage,
  WhatsAppWebhookStatus,
  ApiResponse 
} from "@buievo/types";
import { redis } from "@buievo/redis";
const MESSAGE_QUEUE_CHANNEL = "message-queue";

// This is the main function that handles incoming webhooks from Meta.
export const handleWebhook = async (req: Request, res: Response) => {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId, "WEBHOOK");

  logger.info("Webhook request received", {
    method: req.method,
    url: req.url,
    query: req.query,
  });

  // Handle webhook verification for initial setup with Meta.
  if (
    req.method === "GET" &&
    req.query["hub.mode"] === "subscribe" &&
    req.query["hub.verify_token"]
  ) {
    logger.info("Processing webhook verification request");
    const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN;

    if (req.query["hub.verify_token"] === verifyToken) {
      logger.info("Webhook verification successful");
      webhookMonitor.setVerificationStatus("verified");
      res.status(200).send(req.query["hub.challenge"]);
    } else {
      logger.warn("Webhook verification failed - invalid token");
      res.status(403).send("Forbidden");
    }
    return;
  }

  // Handle incoming messages and status updates.
  if (req.method === "POST") {
    // CRITICAL: Acknowledge the webhook immediately with a 200 OK.
    // Meta requires a fast response, otherwise it will timeout and resend the webhook.
    res.status(200).send("OK");

    // Now, process the webhook payload asynchronously.
    try {
      const { body } = req;
      webhookMonitor.recordWebhookReceived();
      logger.info("Webhook received and recorded, processing will now start.", {
        object: body.object,
        entryCount: body.entry?.length || 0,
      });

      if (body.object === "whatsapp_business_account") {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            logger.info(`Processing webhook field: ${change.field}`);
            
            // Handle different webhook field types
            switch (change.field) {
              case 'messages':
                if (change.value.messages) {
                  logger.info(`Processing ${change.value.messages.length} incoming message(s).`);
                  for (const message of change.value.messages) {
                    (async () => {
                      await handleIncomingMessage(message, logger);
                    })().catch(e => logger.error("Error processing message in background", { error: e }));
                  }
                }
                break;

              case 'statuses':
                if (change.value.statuses) {
                  logger.info(`Processing ${change.value.statuses.length} status update(s).`);
                  for (const status of change.value.statuses) {
                    (async () => {
                      await handleStatusUpdate(status, logger);
                    })().catch(e => logger.error("Error processing status in background", { error: e }));
                  }
                }
                break;

              case 'account_alerts':
                logger.info("Processing account alerts", { value: change.value });
                // Handle account alerts
                break;

              case 'account_review_update':
                logger.info("Processing account review update", { value: change.value });
                // Handle account review updates
                break;

              case 'account_update':
                logger.info("Processing account update", { value: change.value });
                // Handle account updates
                break;

              case 'business_capability_update':
                logger.info("Processing business capability update", { value: change.value });
                // Handle business capability updates
                break;

              case 'message_template_components_update':
                logger.info("Processing template components update", { value: change.value });
                // Handle template component updates
                break;

              case 'message_template_quality_update':
                logger.info("Processing template quality update", { value: change.value });
                // Handle template quality updates
                break;

              case 'message_template_status_update':
                logger.info("Processing template status update", { value: change.value });
                // Handle template status updates
                break;

              case 'phone_number_name_update':
                logger.info("Processing phone number name update", { value: change.value });
                // Handle phone number name updates
                break;

              case 'phone_number_quality_update':
                logger.info("Processing phone number quality update", { value: change.value });
                // Handle phone number quality updates
                break;

              case 'security':
                logger.info("Processing security update", { value: change.value });
                // Handle security updates
                break;

              case 'template_category_update':
                logger.info("Processing template category update", { value: change.value });
                // Handle template category updates
                break;

              default:
                logger.warn(`Unhandled webhook field: ${change.field}`, { value: change.value });
                break;
            }
          }
        }
      } else {
        logger.warn("Unknown webhook object type", { object: body.object });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Webhook processing failed", {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      webhookMonitor.recordWebhookError(errorMessage);
      // Note: We don't send a 500 response here because we've already sent a 200.
      // The error is logged for debugging.
    }
    return; // End the function here since response is already sent.
  }

  // If the method is not GET or POST, it's not supported.
  res.status(405).send("Method Not Allowed");
};


// Test endpoint to simulate receiving a message
export const testReceiveMessage = async (req: Request, res: Response) => {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId, "TEST_WEBHOOK");

  logger.info("Test receive message request", {
    body: req.body,
    headers: req.headers,
  });

  try {
    const { contactId, message } = req.body;

    if (!contactId || !message) {
      logger.warn("Test receive message - missing required fields", {
        contactId: !!contactId,
        message: !!message,
      });
      return res
        .status(400)
        .json({ error: "contactId and message are required" });
    }

    // Get contact
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      logger.warn("Test receive message - contact not found", { contactId });
      return res.status(404).json({ error: "Contact not found" });
    }

    logger.info("Found contact for test message", {
      contactId: contact.id,
      contactPhone: contact.phone,
      contactName: contact.name,
    });

    // Simulate incoming message
    const mockMessage = {
      from: contact.phone,
      id: `test_${Date.now()}`,
      timestamp: Math.floor(Date.now() / 1000).toString(),
      type: "text",
      text: { body: message },
    };

    logger.info("Simulating incoming message", {
      messageId: mockMessage.id,
      from: mockMessage.from,
      message: mockMessage.text.body,
    });

    await handleIncomingMessage(mockMessage, logger);

    logger.info("Test message processed successfully");
    res.json({ success: true, message: "Test message received" });
  } catch (error) {
    logger.error("Test receive message failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: "Internal server error" });
  }
};

// Debug endpoint to test webhook processing step by step
export const debugWebhook = async (req: Request, res: Response) => {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId, "DEBUG_WEBHOOK");

  logger.info("Debug webhook request", {
    body: req.body,
    headers: req.headers,
  });

  try {
    const debugSteps = [];

    // Step 1: Parse webhook body
    const body = req.body;
    debugSteps.push({
      step: 1,
      action: "Parse webhook body",
      success: true,
      data: {
        object: body.object,
        hasEntry: !!body.entry,
        entryCount: body.entry?.length || 0,
      },
    });

    if (body.object !== "whatsapp_business_account") {
      debugSteps.push({
        step: 2,
        action: "Check object type",
        success: false,
        error: "Invalid object type",
      });
      return res.json({ debugSteps });
    }

    debugSteps.push({
      step: 2,
      action: "Check object type",
      success: true,
      data: { object: body.object },
    });

    // Step 3: Process entries
    for (const entry of body.entry || []) {
      debugSteps.push({
        step: 3,
        action: "Process entry",
        success: true,
        data: {
          entryId: entry.id,
          changesCount: entry.changes?.length || 0,
        },
      });

      // Step 4: Process changes
      for (const change of entry.changes || []) {
        debugSteps.push({
          step: 4,
          action: "Process change",
          success: true,
          data: {
            field: change.field,
            hasValue: !!change.value,
            hasMessages: !!change.value?.messages,
            messagesCount: change.value?.messages?.length || 0,
          },
        });

        if (change.field === "messages" && change.value?.messages) {
          // Step 5: Process messages
          for (const message of change.value.messages) {
            debugSteps.push({
              step: 5,
              action: "Process message",
              success: true,
              data: {
                messageId: message.id,
                from: message.from,
                type: message.type,
                hasText: !!message.text,
              },
            });

            // Step 6: Try to process the message
            try {
              await handleIncomingMessage(message, logger);
              debugSteps.push({
                step: 6,
                action: "Handle incoming message",
                success: true,
                data: { messageId: message.id },
              });
            } catch (error) {
              debugSteps.push({
                step: 6,
                action: "Handle incoming message",
                success: false,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }
        }
      }
    }

    res.json({
      success: true,
      debugSteps,
      summary: {
        totalSteps: debugSteps.length,
        successfulSteps: debugSteps.filter((s) => s.success).length,
        failedSteps: debugSteps.filter((s) => !s.success).length,
      },
    });
  } catch (error) {
    logger.error("Debug webhook failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({
      success: false,
      error: "Internal server error",
      debugSteps: [],
    });
  }
};

// Simple test endpoint using only phone numbers
export const testSendMessage = async (req: Request, res: Response) => {
  const requestId = generateRequestId();
  const logger = createRequestLogger(requestId, "TEST_SEND");

  logger.info("Test send message request", {
    body: req.body,
    headers: req.headers,
  });

  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      logger.warn("Test send message - missing required fields", {
        phoneNumber: !!phoneNumber,
        message: !!message,
      });
      return res
        .status(400)
        .json({ error: "phoneNumber and message are required" });
    }

    // Normalize phone number
    const normalizedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;

    logger.info("Sending test message", {
      phoneNumber: normalizedPhone,
      message,
    });

    // Send message directly using phone number
    const jobPayload = {
      phoneNumber: normalizedPhone,
      message: message, // Send as text message instead of template
    };

    // Publish to Redis channel
    await redis.publish(MESSAGE_QUEUE_CHANNEL, JSON.stringify(jobPayload));

    logger.info("Test message queued successfully");
    res.json({ 
      success: true, 
      message: "Message queued for sending",
      phoneNumber: normalizedPhone 
    });
  } catch (error) {
    logger.error("Test send message failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: "Internal server error" });
  }
};

async function handleIncomingMessage(message: WhatsAppWebhookMessage, logger: any) {
  logger.info("Processing incoming message", {
    whatsappId: message.id,
    from: message.from,
    type: message.type,
  });

  try {
    const { from, id, timestamp, type, text, image, document } = message;

    // Normalize phone number for consistent contact lookup
    let normalizedPhone = from.startsWith("+") ? from.substring(1) : from;

    // Specific logic for Indian numbers if needed, can be expanded
    if (normalizedPhone.length === 10 && !normalizedPhone.startsWith("91")) {
      normalizedPhone = `91${normalizedPhone}`;
    }
    
    const phoneWithPlus = `+${normalizedPhone}`;

    logger.info("Phone number normalization", {
      original: from,
      normalized: normalizedPhone,
      final: phoneWithPlus,
    });

    // Find or create the contact
    let contact = await prisma.contact.upsert({
      where: { phone: phoneWithPlus },
      update: { phone: phoneWithPlus }, // Ensure consistent format
      create: {
        name: `WhatsApp User (${phoneWithPlus})`,
        phone: phoneWithPlus,
        status: "active",
      },
    });

    logger.info("Contact found or created", { contactId: contact.id });

    // Find or create the conversation
    let conversation = await prisma.conversation.findFirst({
      where: { contactId: contact.id },
    });

    if (!conversation) {
      logger.info("Creating new conversation", { contactId: contact.id });
      conversation = await prisma.conversation.create({
        data: { contactId: contact.id },
      });
    }

    // Check for duplicate messages to prevent reprocessing
    const existingMessage = await prisma.message.findUnique({
      where: { whatsappId: id },
    });

    if (existingMessage) {
      logger.warn("Duplicate message received, skipping.", { whatsappId: id });
      return;
    }

    // Determine message content
    let content = "";
    let messageType = type;

    if (type === "text" && text) {
      content = text.body;
    } else if (type === "image" && image) {
      content = image.caption || "[Image]";
    } else if (type === "document" && document) {
      content = document.caption || document.filename || "[Document]";
    } else {
      content = `[Unsupported message type: ${type}]`;
    }

    // Create the message and update the conversation in a transaction
    await prisma.$transaction([
      prisma.message.create({
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
      }),
      prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(parseInt(timestamp) * 1000),
          unreadCount: { increment: 1 },
        },
      }),
    ]);

    logger.info("Incoming message processed and stored successfully", {
      whatsappId: id,
      contactId: contact.id,
      conversationId: conversation.id,
    });

  } catch (error) {
    logger.error("Failed to process incoming message", {
      whatsappId: message.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    webhookMonitor.recordWebhookError(`Message processing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function handleStatusUpdate(status: WhatsAppWebhookStatus, logger: any) {
  logger.info("Processing status update", {
    whatsappId: status.id,
    status: status.status,
  });

  try {
    const { id, status: messageStatus, timestamp } = status;

    const result = await prisma.message.updateMany({
      where: { whatsappId: id },
      data: {
        status: messageStatus,
        updatedAt: new Date(parseInt(timestamp) * 1000),
      },
    });

    if (result.count > 0) {
      logger.info("Message status updated successfully", {
        whatsappId: id,
        newStatus: messageStatus,
      });
    } else {
      logger.warn("No message found for status update", { whatsappId: id });
    }

  } catch (error) {
    logger.error("Failed to process status update", {
      whatsappId: status.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
