import { Request, Response } from "express";
import { prisma } from "@whatssuite/db";

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    // Handle webhook verification (GET request)
    if (req.method === "GET" && req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"]) {
      const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN;
      const challenge = req.query["hub.challenge"];

      if (req.query["hub.verify_token"] === verifyToken) {
        console.log("✅ Webhook verified successfully");
        res.status(200).send(challenge);
        return;
      } else {
        console.log("❌ Webhook verification failed");
        res.status(403).send("Forbidden");
        return;
      }
    }

    // Handle incoming messages and status updates (POST request)
    if (req.method === "POST") {
      const { body } = req;
      
      if (body.object === "whatsapp_business_account") {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            if (change.value.messages) {
              // Handle incoming messages
              for (const message of change.value.messages) {
                await handleIncomingMessage(message);
              }
            }

            if (change.value.statuses) {
              // Handle message status updates
              for (const status of change.value.statuses) {
                await handleStatusUpdate(status);
              }
            }
          }
        }
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Test endpoint to simulate receiving a message
export const testReceiveMessage = async (req: Request, res: Response) => {
  try {
    const { contactId, message } = req.body;
    
    if (!contactId || !message) {
      return res.status(400).json({ error: "contactId and message are required" });
    }

    // Get contact
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    // Simulate incoming message
    const mockMessage = {
      from: contact.phone,
      id: `test_${Date.now()}`,
      timestamp: Math.floor(Date.now() / 1000).toString(),
      type: "text",
      text: { body: message },
    };

    await handleIncomingMessage(mockMessage);
    
    res.json({ success: true, message: "Test message received" });
  } catch (error) {
    console.error("Test receive message error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

async function handleIncomingMessage(message: any) {
  try {
    const { from, id, timestamp, type, text, image, document } = message;
    
    console.log(`📥 Received message from ${from}:`, { id, type, text });

    // Find or create contact
    let contact = await prisma.contact.findUnique({
      where: { phone: from },
    });

    if (!contact) {
      // Create contact if not exists
      contact = await prisma.contact.create({
        data: {
          name: `WhatsApp User (${from})`,
          phone: from,
          status: "active",
        },
      });
      console.log(`👤 Created new contact: ${contact.name}`);
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: { contactId: contact.id },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { contactId: contact.id },
      });
    }

    // Determine message content and type
    let content = "";
    let messageType = "text";

    if (type === "text" && text) {
      content = text.body;
    } else if (type === "image" && image) {
      content = image.caption || "Image";
      messageType = "image";
    } else if (type === "document" && document) {
      content = document.caption || document.filename || "Document";
      messageType = "document";
    } else {
      content = `[${type} message]`;
      messageType = type;
    }

    // Store the message
    const dbMessage = await prisma.message.create({
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

    console.log(`💾 Stored incoming message: ${dbMessage.id}`);
  } catch (error) {
    console.error("Error handling incoming message:", error);
  }
}

async function handleStatusUpdate(status: any) {
  try {
    const { id, status: messageStatus, timestamp } = status;
    
    console.log(`📊 Status update for message ${id}: ${messageStatus}`);

    // Find message by WhatsApp ID and update status
    await prisma.message.updateMany({
      where: { whatsappId: id },
      data: {
        status: messageStatus,
        updatedAt: new Date(parseInt(timestamp) * 1000),
      },
    });

    console.log(`✅ Updated message status: ${id} -> ${messageStatus}`);
  } catch (error) {
    console.error("Error handling status update:", error);
  }
}
