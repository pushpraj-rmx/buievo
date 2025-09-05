import { PrismaClient } from "@prisma/client";
import { createError } from "../middleware/error-handler";
import { logger } from "../utils/logger";
import { validateContact, validateUpdateContact } from "@buievo/validation";
import type { CreateContactRequest, UpdateContactRequest } from "@buievo/types";

const prisma = new PrismaClient();

export interface ContactFilters {
  page: number;
  limit: number;
  // Advanced search parameters
  search?: string; // General search across all fields
  name?: string; // Search specifically in name field
  email?: string; // Search specifically in email field
  phone?: string; // Search specifically in phone field
  comment?: string; // Search specifically in comment field
  status?: string;
  segmentId?: string;
  // Date range filters
  createdAfter?: string; // ISO date string
  createdBefore?: string; // ISO date string
  updatedAfter?: string; // ISO date string
  updatedBefore?: string; // ISO date string
}

export interface ContactStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  bySegment: Array<{ segmentId: string; name: string; count: number }>;
}

export class ContactService {
  // Get contacts with pagination and advanced filters
  async getContacts(filters: ContactFilters) {
    const { 
      page, 
      limit, 
      search, 
      name, 
      email, 
      phone, 
      comment, 
      status, 
      segmentId,
      createdAfter,
      createdBefore,
      updatedAfter,
      updatedBefore
    } = filters;
    const skip = (page - 1) * limit;

    // Build where clause with advanced search capabilities
    const where: any = {};
    
    // General search across all fields (OR condition)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { comment: { contains: search, mode: "insensitive" } },
      ];
    }

    // Field-specific searches (AND conditions)
    if (name) {
      where.name = { contains: name, mode: "insensitive" };
    }
    
    if (email) {
      where.email = { contains: email, mode: "insensitive" };
    }
    
    if (phone) {
      where.phone = { contains: phone, mode: "insensitive" };
    }
    
    if (comment) {
      where.comment = { contains: comment, mode: "insensitive" };
    }

    // Status filter
    if (status && status !== "all") {
      where.status = status;
    }

    // Segment filter
    if (segmentId && segmentId !== "all") {
      where.segments = {
        some: {
          id: segmentId,
        },
      };
    }

    // Date range filters
    if (createdAfter || createdBefore) {
      where.createdAt = {};
      if (createdAfter) {
        where.createdAt.gte = new Date(createdAfter);
      }
      if (createdBefore) {
        where.createdAt.lte = new Date(createdBefore);
      }
    }

    if (updatedAfter || updatedBefore) {
      where.updatedAt = {};
      if (updatedAfter) {
        where.updatedAt.gte = new Date(updatedAfter);
      }
      if (updatedBefore) {
        where.updatedAt.lte = new Date(updatedBefore);
      }
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

      // Assign contact to segments if segmentIds provided
      if (validatedData.segmentIds && validatedData.segmentIds.length > 0) {
        await prisma.contact.update({
          where: { id: contact.id },
          data: {
            segments: {
              connect: validatedData.segmentIds.map(segmentId => ({ id: segmentId })),
            },
          },
        });

        // Fetch the contact again with updated segments
        const updatedContact = await prisma.contact.findUnique({
          where: { id: contact.id },
          include: {
            segments: true,
          },
        });

        logger.info(`Contact created: ${contact.id} with ${validatedData.segmentIds.length} segments`);
        return updatedContact || contact;
      }

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

      // Update segments if segmentIds provided
      if (validatedData.segmentIds !== undefined) {
        // First, disconnect all existing segments
        await prisma.contact.update({
          where: { id },
          data: {
            segments: {
              set: [], // This disconnects all existing segments
            },
          },
        });

        // Then connect to new segments if any
        if (validatedData.segmentIds.length > 0) {
          await prisma.contact.update({
            where: { id },
            data: {
              segments: {
                connect: validatedData.segmentIds.map(segmentId => ({ id: segmentId })),
              },
            },
          });
        }

        // Fetch the contact again with updated segments
        const updatedContact = await prisma.contact.findUnique({
          where: { id },
          include: {
            segments: true,
          },
        });

        logger.info(`Contact updated: ${contact.id} with ${validatedData.segmentIds.length} segments`);
        return updatedContact || contact;
      }

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
      updated: 0,
      duplicates: [] as Array<{
        contact: any;
        existingContact: any;
        duplicateType: 'email' | 'phone' | 'both';
      }>,
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

        // Check for existing contacts with same email or phone
        const existingContact = await prisma.contact.findFirst({
          where: {
            OR: [
              ...(emailValue ? [{ email: emailValue }] : []),
              { phone },
            ],
          },
          include: {
            segments: true,
          },
        });

        if (existingContact) {
          // Determine duplicate type
          let duplicateType: 'email' | 'phone' | 'both' = 'phone';
          if (emailValue && existingContact.email === emailValue) {
            duplicateType = existingContact.phone === phone ? 'both' : 'email';
          }

          results.duplicates.push({
            contact: contactData,
            existingContact: {
              id: existingContact.id,
              name: existingContact.name,
              email: existingContact.email,
              phone: existingContact.phone,
              status: existingContact.status,
              comment: existingContact.comment,
              segments: existingContact.segments,
              createdAt: existingContact.createdAt,
              updatedAt: existingContact.updatedAt,
            },
            duplicateType,
          });
          continue;
        }

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

    logger.info(`Bulk import completed: ${results.created} created, ${results.duplicates.length} duplicates, ${results.errors.length} errors`);
    return results;
  }

  // Resolve duplicates from bulk import
  async resolveDuplicates(duplicates: Array<{
    contact: any;
    existingContact: any;
    duplicateType: 'email' | 'phone' | 'both';
  }>, action: 'update' | 'skip' | 'force-create', segmentIds?: string[]) {
    const results = {
      updated: 0,
      created: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const duplicate of duplicates) {
      try {
        const { contact, existingContact } = duplicate;

        if (action === 'skip') {
          results.skipped++;
          continue;
        }

        if (action === 'update') {
          // Update existing contact with new data, but be careful with unique fields
          const updateData: any = {
            name: contact.name,
            status: contact.status,
            comment: contact.comment,
          };

          // Only update email if it's not already taken by another contact
          if (contact.email !== undefined) {
            if (contact.email === "") {
              updateData.email = null;
            } else {
              // Check if this email is already used by another contact
              const emailConflict = await prisma.contact.findFirst({
                where: {
                  email: contact.email,
                  id: { not: existingContact.id },
                },
              });
              if (!emailConflict) {
                updateData.email = contact.email;
              }
            }
          }

          // Add to segments if provided
          if (segmentIds) {
            updateData.segments = {
              connect: segmentIds.map((id) => ({ id })),
            };
          }

          await prisma.contact.update({
            where: { id: existingContact.id },
            data: updateData,
          });
          results.updated++;
        } else if (action === 'force-create') {
          // Force create new contact (may require unique identifiers)
          const uniquePhone = `${contact.phone}_${Date.now()}`;
          const uniqueEmail = contact.email ? `${contact.email.split('@')[0]}_${Date.now()}@${contact.email.split('@')[1]}` : null;

          await prisma.contact.create({
            data: {
              name: contact.name,
              email: uniqueEmail,
              phone: uniquePhone,
              status: contact.status,
              comment: contact.comment,
              segments: segmentIds
                ? {
                    connect: segmentIds.map((id) => ({ id })),
                  }
                : undefined,
            },
          });
          results.created++;
        }
      } catch (error) {
        results.errors.push(
          `Failed to resolve duplicate: ${JSON.stringify(duplicate.contact)} - ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    logger.info(`Duplicate resolution completed: ${results.updated} updated, ${results.created} created, ${results.skipped} skipped, ${results.errors.length} errors`);
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
      bySegment: segmentStats.map((segment: any) => ({
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
