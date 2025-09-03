import { PrismaClient } from "@prisma/client";
import { createError } from "../middleware/error-handler";
import { logger } from "../utils/logger";
import { validateContact, validateUpdateContact } from "@buievo/validation";
import type { CreateContactRequest, UpdateContactRequest } from "@buievo/types";

const prisma = new PrismaClient();

export interface ContactFilters {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  segmentId?: string;
}

export interface ContactStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  bySegment: Array<{ segmentId: string; name: string; count: number }>;
}

export class ContactService {
  // Get contacts with pagination and filters
  async getContacts(filters: ContactFilters) {
    const { page, limit, search, status, segmentId } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      OR?: Array<{
        name?: { contains: string; mode: "insensitive" };
        email?: { contains: string; mode: "insensitive" };
        phone?: { contains: string; mode: "insensitive" };
      }>;
      status?: string;
      segments?: {
        some: {
          id: string;
        };
      };
    } = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (segmentId && segmentId !== "all") {
      where.segments = {
        some: {
          id: segmentId,
        },
      };
    }

    // Get contacts with segments
    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          segments: true,
          conversations: {
            select: {
              id: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.contact.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    };
  }

  // Get single contact by ID
  async getContactById(id: string) {
    return prisma.contact.findUnique({
      where: { id },
      include: {
        segments: true,
        conversations: {
          include: {
            messages: {
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
            },
          },
        },
      },
    });
  }

  // Create new contact
  async createContact(data: CreateContactRequest) {
    try {
      // Validate input
      const validatedData = validateContact(data);

      // Check if contact with same phone already exists
      const existingContact = await prisma.contact.findFirst({
        where: { phone: validatedData.phone },
      });

      if (existingContact) {
        throw createError("Contact with this phone number already exists", 400);
      }

      // Convert empty email to null
      const emailValue = validatedData.email === "" ? null : validatedData.email;

      // Create contact
      const contact = await prisma.contact.create({
        data: {
          name: validatedData.name,
          email: emailValue,
          phone: validatedData.phone,
          comment: validatedData.comment,
        },
        include: {
          segments: true,
        },
      });

      logger.info(`Contact created: ${contact.id}`);
      return contact;
    } catch (error) {
      logger.error("Error creating contact:", error);
      throw error;
    }
  }

  // Update contact
  async updateContact(id: string, data: UpdateContactRequest) {
    try {
      // Validate input
      const validatedData = validateUpdateContact(data);

      // Check if contact exists
      const existingContact = await prisma.contact.findUnique({
        where: { id },
      });

      if (!existingContact) {
        throw createError("Contact not found", 404);
      }

      // Convert empty email to null
      const emailValue = validatedData.email === "" ? null : validatedData.email;

      // Update contact
      const contact = await prisma.contact.update({
        where: { id },
        data: {
          name: validatedData.name,
          email: emailValue,
          phone: validatedData.phone,
          status: validatedData.status,
          comment: validatedData.comment,
        },
        include: {
          segments: true,
        },
      });

      logger.info(`Contact updated: ${contact.id}`);
      return contact;
    } catch (error) {
      logger.error("Error updating contact:", error);
      throw error;
    }
  }

  // Delete contact
  async deleteContact(id: string) {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id },
      });

      if (!contact) {
        return false;
      }

      await prisma.contact.delete({
        where: { id },
      });

      logger.info(`Contact deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error("Error deleting contact:", error);
      throw error;
    }
  }

  // Bulk import contacts
  async bulkImportContacts(contacts: Array<{
    name: string;
    email?: string;
    phone: string;
    status?: string;
    comment?: string;
  }>, segmentIds?: string[]) {
    const results = {
      created: 0,
      errors: [] as string[],
    };

    for (const contactData of contacts) {
      try {
        const { name, email, phone, status = "active", comment } = contactData;

        if (!name || !phone) {
          results.errors.push(
            `Contact missing name or phone: ${JSON.stringify(contactData)}`
          );
          continue;
        }

        // Convert empty email to null
        const emailValue = email === "" ? null : email;

        // Create contact
        await prisma.contact.create({
          data: {
            name,
            email: emailValue,
            phone,
            status,
            comment,
            segments: segmentIds
              ? {
                  connect: segmentIds.map((id) => ({ id })),
                }
              : undefined,
          },
        });

        results.created++;
      } catch (error) {
        results.errors.push(
          `Failed to create contact: ${JSON.stringify(contactData)} - ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    logger.info(`Bulk import completed: ${results.created} created, ${results.errors.length} errors`);
    return results;
  }

  // Export contacts
  async exportContacts(options: { format: string; segmentId?: string; status?: string }) {
    const { format, segmentId, status } = options;

    // Build where clause
    const where: {
      status?: string;
      segments?: {
        some: {
          id: string;
        };
      };
    } = {};
    
    if (status && status !== "all") {
      where.status = status;
    }

    if (segmentId && segmentId !== "all") {
      where.segments = {
        some: {
          id: segmentId,
        },
      };
    }

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        segments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (format === "csv") {
      return this.generateCSV(contacts);
    }

    return contacts;
  }

  // Search contacts
  async searchContacts(query: string, limit: number = 10) {
    return prisma.contact.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        segments: true,
      },
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // Get contact statistics
  async getContactStats(): Promise<ContactStats> {
    const [total, active, inactive, pending, segmentStats] = await Promise.all([
      prisma.contact.count(),
      prisma.contact.count({ where: { status: "active" } }),
      prisma.contact.count({ where: { status: "inactive" } }),
      prisma.contact.count({ where: { status: "pending" } }),
      prisma.segment.findMany({
        include: {
          _count: {
            select: {
              contacts: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      active,
      inactive,
      pending,
      bySegment: segmentStats.map((segment) => ({
        segmentId: segment.id,
        name: segment.name,
        count: segment._count.contacts,
      })),
    };
  }

  // Generate CSV from contacts
  private generateCSV(contacts: Array<{
    name: string;
    email: string | null;
    phone: string;
    status: string;
    comment: string | null;
    segments: Array<{ name: string }>;
    createdAt: Date;
  }>): string {
    const headers = ["Name", "Email", "Phone", "Status", "Comment", "Segments", "Created At"];
    
    const rows = contacts.map((contact) => [
      contact.name,
      contact.email || "",
      contact.phone,
      contact.status,
      contact.comment || "",
      contact.segments.map((s: { name: string }) => s.name).join("; "),
      new Date(contact.createdAt).toLocaleDateString(),
    ]);

    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  }
}
