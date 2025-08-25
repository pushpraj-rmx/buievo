import { prisma } from "@whatssuite/db";

export class ContactService {
  /**
   * Get contacts with pagination and filtering
   */
  async getContacts(
    page: number = 1,
    limit: number = 20,
    search?: string,
    status?: string
  ): Promise<{
    data: any[];
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
  async getContactById(id: string): Promise<any | null> {
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

    return contact;
  }

  /**
   * Create a new contact
   */
  async createContact(data: {
    name: string;
    email?: string;
    phone: string;
    comment?: string;
    status?: string;
    segmentIds?: string[];
  }): Promise<any> {
    const contact = await prisma.contact.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: data.status || 'active',
        comment: data.comment,
        segments: data.segmentIds ? {
          connect: data.segmentIds.map(id => ({ id }))
        } : undefined,
      },
      include: {
        segments: true,
      },
    });

    return contact;
  }

  /**
   * Update an existing contact
   */
  async updateContact(id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    comment?: string;
    status?: string;
    segmentIds?: string[];
  }): Promise<any> {
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: data.status,
        comment: data.comment,
        segments: data.segmentIds ? {
          set: data.segmentIds.map(segmentId => ({ id: segmentId }))
        } : undefined,
      },
      include: {
        segments: true,
      },
    });

    return contact;
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
   * Get contact statistics
   */
  async getContactStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    pending: number;
  }> {
    const [total, active, inactive, pending] = await Promise.all([
      prisma.contact.count(),
      prisma.contact.count({ where: { status: 'active' } }),
      prisma.contact.count({ where: { status: 'inactive' } }),
      prisma.contact.count({ where: { status: 'pending' } }),
    ]);

    return {
      total,
      active,
      inactive,
      pending,
    };
  }

  /**
   * Search contacts by phone number
   */
  async findContactByPhone(phone: string): Promise<any | null> {
    const contact = await prisma.contact.findFirst({
      where: {
        OR: [
          { phone },
          { phone: phone.startsWith('+') ? phone.substring(1) : `+${phone}` },
        ],
      },
      include: {
        segments: true,
      },
    });

    return contact;
  }
}

// Export singleton instance
export const contactService = new ContactService();
