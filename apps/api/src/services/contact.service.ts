import { prisma } from "@buievo/db";
import type { 
  ContactServiceResponse, 
  SingleContactResponse,
  CreateContactRequest,
  UpdateContactRequest,
  ContactWithSegments
} from "@buievo/types";

export class ContactService {
  /**
   * Get contacts with pagination and filtering
   */
  async getContacts(
    page: number = 1,
    limit: number = 20,
    search?: string,
    status?: string
  ): Promise<ContactServiceResponse> {
    const skip = (page - 1) * limit;
    
    // Build where clause based on filters
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (status) {
      where.status = status;
    }

    // Get contacts with segments
    const contacts = await prisma.contact.findMany({
      where,
      include: {
        segments: true,
        _count: {
          select: {
            conversations: true,
            segments: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get total count for pagination
    const total = await prisma.contact.count({ where });

    return {
      data: contacts,
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
   * Get a single contact by ID
   */
  async getContactById(id: string): Promise<{ contact: any }> {
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        segments: true,
        conversations: {
          include: {
            messages: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 10,
            },
          },
          orderBy: {
            lastMessageAt: 'desc',
          },
          take: 5,
        },
        _count: {
          select: {
            conversations: true,
            segments: true,
          },
        },
      },
    });

    return { contact };
  }

  /**
   * Create a new contact
   */
  async createContact(data: CreateContactRequest): Promise<{ contact: any }> {
    const contact = await prisma.contact.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        comment: data.comment,
        status: 'active',
      },
      include: {
        segments: true,
      },
    });

    return { contact };
  }

  /**
   * Update an existing contact
   */
  async updateContact(id: string, data: UpdateContactRequest): Promise<{ contact: any }> {
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        comment: data.comment,
        status: data.status,
      },
      include: {
        segments: true,
      },
    });

    return { contact };
  }

  /**
   * Delete a contact
   */
  async deleteContact(id: string): Promise<boolean> {
    try {
      await prisma.contact.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Add contact to segments
   */
  async addContactToSegments(contactId: string, segmentIds: string[]): Promise<{ contact: any }> {
    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        segments: {
          connect: segmentIds.map(id => ({ id })),
        },
      },
      include: {
        segments: true,
      },
    });

    return { contact };
  }

  /**
   * Remove contact from segments
   */
  async removeContactFromSegments(contactId: string, segmentIds: string[]): Promise<{ contact: any }> {
    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        segments: {
          disconnect: segmentIds.map(id => ({ id })),
        },
      },
      include: {
        segments: true,
      },
    });

    return { contact };
  }

  /**
   * Get contacts by segment
   */
  async getContactsBySegment(segmentId: string, page: number = 1, limit: number = 20): Promise<ContactServiceResponse> {
    const skip = (page - 1) * limit;

    const contacts = await prisma.contact.findMany({
      where: {
        segments: {
          some: {
            id: segmentId,
          },
        },
      },
      include: {
        segments: true,
        _count: {
          select: {
            conversations: true,
            segments: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.contact.count({
      where: {
        segments: {
          some: {
            id: segmentId,
          },
        },
      },
    });

    return {
      data: contacts,
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
   * Search contacts
   */
  async searchContacts(query: string, page: number = 1, limit: number = 20): Promise<ContactServiceResponse> {
    const skip = (page - 1) * limit;

    const contacts = await prisma.contact.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { comment: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        segments: true,
        _count: {
          select: {
            conversations: true,
            segments: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.contact.count({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { comment: { contains: query, mode: 'insensitive' } },
        ],
      },
    });

    return {
      data: contacts,
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

export const contactService = new ContactService();
