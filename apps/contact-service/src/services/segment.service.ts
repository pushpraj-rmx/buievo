import { PrismaClient } from "@prisma/client";
import { createError } from "../middleware/error-handler";
import { logger } from "../utils/logger";
import { z } from "zod";

const prisma = new PrismaClient();

const createSegmentSchema = z.object({
  name: z.string().min(1, "Segment name is required"),
  description: z.string().optional(),
});

const updateSegmentSchema = z.object({
  name: z.string().min(1, "Segment name is required").optional(),
  description: z.string().optional(),
});

export class SegmentService {
  // Get all segments with contact counts
  async getSegments() {
    return prisma.segment.findMany({
      include: {
        _count: {
          select: {
            contacts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // Get single segment by ID
  async getSegmentById(id: string) {
    return prisma.segment.findUnique({
      where: { id },
      include: {
        contacts: {
          include: {
            segments: true,
          },
        },
        _count: {
          select: {
            contacts: true,
          },
        },
      },
    });
  }

  // Create new segment
  async createSegment(data: {
    name: string;
    description?: string;
  }) {
    try {
      // Validate input
      const validatedData = createSegmentSchema.parse(data);

      // Check if segment with same name already exists
      const existingSegment = await prisma.segment.findFirst({
        where: { name: validatedData.name },
      });

      if (existingSegment) {
        throw createError("Segment with this name already exists", 400);
      }

      // Create segment
      const segment = await prisma.segment.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
        },
        include: {
          _count: {
            select: {
              contacts: true,
            },
          },
        },
      });

      logger.info(`Segment created: ${segment.id}`);
      return segment;
    } catch (error) {
      logger.error("Error creating segment:", error);
      throw error;
    }
  }

  // Update segment
  async updateSegment(id: string, data: {
    name?: string;
    description?: string;
  }) {
    try {
      // Validate input
      const validatedData = updateSegmentSchema.parse(data);

      // Check if segment exists
      const existingSegment = await prisma.segment.findUnique({
        where: { id },
      });

      if (!existingSegment) {
        throw createError("Segment not found", 404);
      }

      // Check if name is being changed and if it conflicts
      if (validatedData.name && validatedData.name !== existingSegment.name) {
        const nameConflict = await prisma.segment.findFirst({
          where: {
            name: validatedData.name,
            id: { not: id },
          },
        });

        if (nameConflict) {
          throw createError("Segment with this name already exists", 400);
        }
      }

      // Update segment
      const segment = await prisma.segment.update({
        where: { id },
        data: {
          name: validatedData.name,
          description: validatedData.description,
        },
        include: {
          _count: {
            select: {
              contacts: true,
            },
          },
        },
      });

      logger.info(`Segment updated: ${segment.id}`);
      return segment;
    } catch (error) {
      logger.error("Error updating segment:", error);
      throw error;
    }
  }

  // Delete segment
  async deleteSegment(id: string) {
    try {
      const segment = await prisma.segment.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              contacts: true,
            },
          },
        },
      });

      if (!segment) {
        return false;
      }

      // Check if segment has contacts
      if (segment._count.contacts > 0) {
        throw createError(
          `Cannot delete segment with ${segment._count.contacts} contacts. Remove contacts first.`,
          400
        );
      }

      await prisma.segment.delete({
        where: { id },
      });

      logger.info(`Segment deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error("Error deleting segment:", error);
      throw error;
    }
  }

  // Get segment statistics
  async getSegmentStats() {
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

    const totalSegments = segments.length;
    // Calculate total contacts by querying separately
    const totalContacts = await prisma.contact.count();
    const averageContactsPerSegment = totalSegments > 0 ? totalContacts / totalSegments : 0;

    return {
      totalSegments,
      totalContacts,
      averageContactsPerSegment: Math.round(averageContactsPerSegment * 100) / 100,
      segments,
    };
  }

  // Add contacts to segment
  async addContactsToSegment(segmentId: string, contactIds: string[]) {
    try {
      // Check if segment exists
      const segment = await prisma.segment.findUnique({
        where: { id: segmentId },
      });

      if (!segment) {
        throw createError("Segment not found", 404);
      }

      // Check if contacts exist
      const existingContacts = await prisma.contact.findMany({
        where: {
          id: { in: contactIds },
        },
        select: { id: true },
      });

      if (existingContacts.length !== contactIds.length) {
        throw createError("Some contacts not found", 404);
      }

      // Add contacts to segment
      await prisma.segment.update({
        where: { id: segmentId },
        data: {
          contacts: {
            connect: contactIds.map((id) => ({ id })),
          },
        },
      });

      logger.info(`Added ${contactIds.length} contacts to segment: ${segmentId}`);
      return {
        message: `Added ${contactIds.length} contacts to segment`,
        segmentId,
        contactIds,
      };
    } catch (error) {
      logger.error("Error adding contacts to segment:", error);
      throw error;
    }
  }

  // Remove contacts from segment
  async removeContactsFromSegment(segmentId: string, contactIds: string[]) {
    try {
      // Check if segment exists
      const segment = await prisma.segment.findUnique({
        where: { id: segmentId },
      });

      if (!segment) {
        throw createError("Segment not found", 404);
      }

      // Remove contacts from segment
      await prisma.segment.update({
        where: { id: segmentId },
        data: {
          contacts: {
            disconnect: contactIds.map((id) => ({ id })),
          },
        },
      });

      logger.info(`Removed ${contactIds.length} contacts from segment: ${segmentId}`);
      return {
        message: `Removed ${contactIds.length} contacts from segment`,
        segmentId,
        contactIds,
      };
    } catch (error) {
      logger.error("Error removing contacts from segment:", error);
      throw error;
    }
  }
}
