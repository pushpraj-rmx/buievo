import { prisma } from "@whatssuite/db";
import type { 
  ConversationServiceResponse, 
  SingleConversationResponse,
  ConversationWithMessages,
  ConversationSummary
} from "@whatssuite/types";

export class ConversationService {
  /**
   * Get conversations with pagination and filtering
   */
  async getConversations(
    page: number = 1,
    limit: number = 20,
    contactId?: string
  ): Promise<{
    conversations: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const skip = (page - 1) * limit;
    
    // Build where clause based on filters
    const where: any = {};
    
    if (contactId) {
      where.contactId = contactId;
    }

    // Get conversations with contact and last message
    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        messages: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 1,
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        lastMessageAt: 'desc',
      },
    });

    // Get total count for pagination
    const total = await prisma.conversation.count({ where });

    return {
      conversations: conversations as any,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get a single conversation by ID with messages
   */
  async getConversationWithMessages(conversationId: string): Promise<any | null> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        messages: {
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
    });

    return conversation;
  }

  /**
   * Create a new conversation
   */
  async createConversation(contactId: string): Promise<{ conversation: any }> {
    const conversation = await prisma.conversation.create({
      data: {
        contactId,
        lastMessageAt: new Date(),
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    return { conversation };
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(
    conversationId: string,
    messageData: {
      from: string;
      to: string;
      body: string;
      type: string;
      direction: string;
      whatsappId?: string;
    }
  ): Promise<{ message: any }> {
    const message = await prisma.message.create({
      data: {
        conversationId,
        from: messageData.from,
        to: messageData.to,
        body: messageData.body,
        type: messageData.type,
        direction: messageData.direction,
        status: 'sent',
        timestamp: new Date(),
        whatsappId: messageData.whatsappId,
      },
    });

    // Update conversation's lastMessageAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
      },
    });

    return { message };
  }

  /**
   * Update message status
   */
  async updateMessageStatus(
    messageId: string,
    status: string
  ): Promise<{ message: any }> {
    const message = await prisma.message.update({
      where: { id: messageId },
      data: {
        status,
      },
    });

    return { message };
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(): Promise<{
    total: number;
    unread: number;
  }> {
    const [total, unread] = await Promise.all([
      prisma.conversation.count(),
      prisma.conversation.count({ where: { unreadCount: { gt: 0 } } }),
    ]);

    return {
      total,
      unread,
    };
  }

  /**
   * Mark conversation as read
   */
  async markConversationAsRead(conversationId: string): Promise<{ conversation: any }> {
    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        unreadCount: 0,
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    return { conversation };
  }

  /**
   * Archive a conversation (mark as read and reset unread count)
   */
  async archiveConversation(conversationId: string): Promise<{ conversation: any }> {
    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        unreadCount: 0,
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    return { conversation };
  }

  /**
   * Unarchive a conversation (reset unread count)
   */
  async unarchiveConversation(conversationId: string): Promise<{ conversation: any }> {
    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        unreadCount: 0,
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    return { conversation };
  }

  /**
   * Delete a conversation and all its messages
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      // Delete all messages first
      await prisma.message.deleteMany({
        where: { conversationId },
      });

      // Then delete the conversation
      await prisma.conversation.delete({
        where: { id: conversationId },
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Search conversations
   */
  async searchConversations(
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    conversations: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const skip = (page - 1) * limit;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          {
            contact: {
              name: { contains: query, mode: 'insensitive' },
            },
          },
          {
            contact: {
              phone: { contains: query, mode: 'insensitive' },
            },
          },
          {
            messages: {
              some: {
                body: { contains: query, mode: 'insensitive' },
              },
            },
          },
        ],
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        messages: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 1,
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        lastMessageAt: 'desc',
      },
    });

    const total = await prisma.conversation.count({
      where: {
        OR: [
          {
            contact: {
              name: { contains: query, mode: 'insensitive' },
            },
          },
          {
            contact: {
              phone: { contains: query, mode: 'insensitive' },
            },
          },
          {
            messages: {
              some: {
                body: { contains: query, mode: 'insensitive' },
              },
            },
          },
        ],
      },
    });

    return {
      conversations: conversations as any,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }
}

export const conversationService = new ConversationService();
