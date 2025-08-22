import { Request, Response } from "express";
import { prisma } from "@whatssuite/db";
import { redis } from "@whatssuite/redis";

// Get all contacts with pagination and filtering
export const getContacts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, status, segmentId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
        { phone: { contains: search as string, mode: "insensitive" } },
      ];
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (segmentId) {
      where.segments = {
        some: {
          id: segmentId as string,
        },
      };
    }

    // Get contacts with segments
    const contacts = await prisma.contact.findMany({
      where,
      include: {
        segments: true,
        conversations: {
          select: {
            id: true,
            lastMessageAt: true,
            unreadCount: true,
          },
          orderBy: {
            lastMessageAt: "desc",
          },
          take: 1,
        },
      },
      skip,
      take: Number(limit),
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get total count for pagination
    const total = await prisma.contact.count({ where });

    res.json({
      contacts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get a single contact by ID
export const getContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        segments: true,
        conversations: {
          include: {
            messages: {
              orderBy: {
                timestamp: "desc",
              },
              take: 10,
            },
          },
          orderBy: {
            lastMessageAt: "desc",
          },
        },
      },
    });

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.json(contact);
  } catch (error) {
    console.error("Error fetching contact:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create a new contact
export const createContact = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      status = "active",
      comment,
      segmentIds,
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }

    // Check if phone already exists
    const existingContact = await prisma.contact.findUnique({
      where: { phone },
    });

    if (existingContact) {
      return res
        .status(400)
        .json({ message: "Contact with this phone number already exists" });
    }

    // Create contact with optional segments
    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        phone,
        status,
        comment,
        segments: segmentIds
          ? {
              connect: segmentIds.map((id: string) => ({ id })),
            }
          : undefined,
      },
      include: {
        segments: true,
      },
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error("Error creating contact:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update a contact
export const updateContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, status, comment, segmentIds } = req.body;

    // Check if contact exists
    const existingContact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!existingContact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    // Check if phone is being changed and if it already exists
    if (phone && phone !== existingContact.phone) {
      const phoneExists = await prisma.contact.findUnique({
        where: { phone },
      });

      if (phoneExists) {
        return res
          .status(400)
          .json({ message: "Contact with this phone number already exists" });
      }
    }

    // Update contact
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        status,
        comment,
        segments: segmentIds
          ? {
              set: [], // Clear existing segments
              connect: segmentIds.map((id: string) => ({ id })),
            }
          : undefined,
      },
      include: {
        segments: true,
      },
    });

    res.json(contact);
  } catch (error) {
    console.error("Error updating contact:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a contact
export const deleteContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    await prisma.contact.delete({
      where: { id },
    });

    res.json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Bulk import contacts
export const bulkImportContacts = async (req: Request, res: Response) => {
  try {
    const { contacts, segmentIds } = req.body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ message: "Contacts array is required" });
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const contactData of contacts) {
      try {
        const { name, email, phone, status = "active", comment } = contactData;

        if (!name || !phone) {
          results.errors.push(
            `Contact missing name or phone: ${JSON.stringify(contactData)}`,
          );
          continue;
        }

        // Check if phone already exists
        const existingContact = await prisma.contact.findUnique({
          where: { phone },
        });

        if (existingContact) {
          results.skipped++;
          continue;
        }

        // Create contact
        await prisma.contact.create({
          data: {
            name,
            email,
            phone,
            status,
            comment,
            segments: segmentIds
              ? {
                  connect: segmentIds.map((id: string) => ({ id })),
                }
              : undefined,
          },
        });

        results.created++;
      } catch (error) {
        results.errors.push(`Error creating contact: ${error}`);
      }
    }

    res.json({
      message: "Bulk import completed",
      results,
    });
  } catch (error) {
    console.error("Error in bulk import:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all segments
export const getSegments = async (req: Request, res: Response) => {
  try {
    const segments = await prisma.segment.findMany({
      include: {
        _count: {
          select: {
            contacts: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json(segments);
  } catch (error) {
    console.error("Error fetching segments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create a new segment
export const createSegment = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Segment name is required" });
    }

    // Check if segment already exists
    const existingSegment = await prisma.segment.findUnique({
      where: { name },
    });

    if (existingSegment) {
      return res
        .status(400)
        .json({ message: "Segment with this name already exists" });
    }

    const segment = await prisma.segment.create({
      data: { name },
      include: {
        _count: {
          select: {
            contacts: true,
          },
        },
      },
    });

    res.status(201).json(segment);
  } catch (error) {
    console.error("Error creating segment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update a segment
export const updateSegment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Segment name is required" });
    }

    const segment = await prisma.segment.findUnique({
      where: { id },
    });

    if (!segment) {
      return res.status(404).json({ message: "Segment not found" });
    }

    // Check if name is being changed and if it already exists
    if (name !== segment.name) {
      const nameExists = await prisma.segment.findUnique({
        where: { name },
      });

      if (nameExists) {
        return res
          .status(400)
          .json({ message: "Segment with this name already exists" });
      }
    }

    const updatedSegment = await prisma.segment.update({
      where: { id },
      data: { name },
      include: {
        _count: {
          select: {
            contacts: true,
          },
        },
      },
    });

    res.json(updatedSegment);
  } catch (error) {
    console.error("Error updating segment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a segment
export const deleteSegment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const segment = await prisma.segment.findUnique({
      where: { id },
    });

    if (!segment) {
      return res.status(404).json({ message: "Segment not found" });
    }

    await prisma.segment.delete({
      where: { id },
    });

    res.json({ message: "Segment deleted successfully" });
  } catch (error) {
    console.error("Error deleting segment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendMessageToContact = async (req: Request, res: Response) => {
  // Get the contact ID from the URL parameters
  const { id: contactId } = req.params;
  console.log(`Received request to send message to contactId: ${contactId}`);

  try {
    // Optional: Verify the contact exists before queueing the job
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    // The job payload for the wapp-service
    const jobPayload = {
      contactId: contactId,
      templateName: "hello_world", // Or another template from the request body
      params: [], // You could also get these from the request body
    };

    // Publish the job to the Redis queue
    await redis.publish("message-queue", JSON.stringify(jobPayload));
    console.log(`✅ Queued message job for contactId: ${contactId}`);

    // Respond with 202 (Accepted) to indicate the job was queued successfully
    res.status(202).json({ message: "Message queued successfully" });
  } catch (error) {
    console.error("Error queueing message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendMessageToNumber = async (req: Request, res: Response) => {
  const {
    phoneNumber,
    templateName = "hello_world",
    params = [],
    buttonParams = [],
    imageUrl, // Add support for image URL
    documentUrl, // Add support for document URL
    filename, // Add support for filename
  } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ message: "phoneNumber is required" });
  }

  try {
    // The job payload for the wapp-service
    const jobPayload = {
      phoneNumber,
      templateName,
      params,
      buttonParams,
      imageUrl, // Include imageUrl in the job payload
      documentUrl, // Include documentUrl in the job payload
      filename, // Include filename in the job payload
    };

    // Publish the job to the Redis queue
    await redis.publish("message-queue", JSON.stringify(jobPayload));
    console.log(`✅ Queued message job for phoneNumber: ${phoneNumber}`);

    // Respond with 202 (Accepted) to indicate the job was queued successfully
    res.status(202).json({ message: "Message queued successfully" });
  } catch (error) {
    console.error("Error queueing message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
