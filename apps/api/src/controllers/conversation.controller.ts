import { Request, Response } from "express";
import { prisma } from "@buievo/db";
import { wappClient } from "@buievo/wapp-client";
import type { 
  ConversationSummary, 
  ConversationWithMessages, 
  MessageResponse,
  SendMessageRequest,
  ApiResponse 
} from "@buievo/types";

export const getConversations = async (req: Request, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      include: {
        contact: {
          include: {
            segments: true,
          },
        },
        messages: {
          orderBy: {
            timestamp: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    const transformedConversations = conversations.map((conversation) => ({
      id: conversation.id,
      contactId: conversation.contactId,
      contact: conversation.contact,
      lastMessage: conversation.messages[0] ? {
        id: conversation.messages[0].id,
        content: conversation.messages[0].body || "",
        type: conversation.messages[0].type,
        direction: conversation.messages[0].direction,
        status: conversation.messages[0].status,
        timestamp: conversation.messages[0].timestamp.toISOString(),
      } : {
        id: "",
        content: "No messages yet",
        type: "text",
        direction: "outbound",
        status: "sent",
        timestamp: conversation.createdAt.toISOString(),
      },
      unreadCount: conversation.unreadCount,
      lastMessageAt: conversation.lastMessageAt,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    }));

    res.json(transformedConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getConversation = async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params;

    let conversation = await prisma.conversation.findFirst({
      where: {
        contactId,
      },
      include: {
        contact: {
          include: {
            segments: true,
          },
        },
        messages: {
          orderBy: {
            timestamp: "asc",
          },
        },
      },
    });

    if (!conversation) {
      // Create conversation if it doesn't exist
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        include: {
          segments: true,
        },
      });

      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      conversation = await prisma.conversation.create({
        data: {
          contactId,
        },
        include: {
          contact: {
            include: {
              segments: true,
            },
          },
          messages: {
            orderBy: {
              timestamp: "asc",
            },
          },
        },
      });
    }

    // Mark conversation as read
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { unreadCount: 0 },
    });

    const transformedMessages = conversation.messages.map((message) => ({
      id: message.id,
      conversationId: message.conversationId,
      content: message.body || "",
      type: message.type,
      direction: message.direction,
      status: message.status,
      timestamp: message.timestamp.toISOString(),
      whatsappId: message.whatsappId,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    }));

    res.json({
      id: conversation.id,
      contact: conversation.contact,
      messages: transformedMessages,
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params;
    const { content, type = "text" } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Message content is required" });
    }

    // Get or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: { contactId },
      include: {
        contact: true,
      },
    });

    if (!conversation) {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
      });

      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      conversation = await prisma.conversation.create({
        data: { contactId },
        include: {
          contact: true,
        },
      });
    }

    // Send message via WhatsApp Business API
    let whatsappResponse;
    try {
      whatsappResponse = await wappClient.sendTextMessage({
        to: conversation.contact.phone,
        text: content,
      });
    } catch (whatsappError) {
      console.error("WhatsApp API error:", whatsappError);
      return res.status(500).json({
        message: "Failed to send message via WhatsApp",
        error:
          whatsappError instanceof Error
            ? whatsappError.message
            : "Unknown error",
      });
    }

    // Store message in database
    const message = await prisma.message.create({
      data: {
        from: "business",
        to: contactId,
        body: content,
        type,
        timestamp: new Date(),
        status: "sent", // We'll update this based on webhook responses
        direction: "outbound",
        conversationId: conversation.id,
        whatsappId: whatsappResponse.messages?.[0]?.id, // Store WhatsApp's message ID
      },
    });

    // Update conversation's last message timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    const transformedMessage = {
      id: message.id,
      content: message.body || "",
      type: message.type,
      direction: message.direction,
      status: message.status,
      timestamp: message.timestamp.toISOString(),
    };

    res.json(transformedMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params;

    const conversation = await prisma.conversation.findFirst({
      where: { contactId },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { unreadCount: 0 },
    });

    res.json({ message: "Conversation marked as read" });
  } catch (error) {
    console.error("Error marking conversation as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
