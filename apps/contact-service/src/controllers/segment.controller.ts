import { Request, Response } from "express";
import { SegmentService } from "../services/segment.service";
import { createError } from "../middleware/error-handler";
import { logger } from "../utils/logger";

const segmentService = new SegmentService();

export class SegmentController {
  // Get all segments
  static async getSegments(req: Request, res: Response) {
    try {
      const segments = await segmentService.getSegments();
      res.json(segments);
    } catch (error) {
      logger.error("Error fetching segments:", error);
      throw createError("Failed to fetch segments", 500);
    }
  }

  // Get single segment by ID
  static async getSegment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw createError("Segment ID is required", 400);
      }
      
      const segment = await segmentService.getSegmentById(id);
      
      if (!segment) {
        throw createError("Segment not found", 404);
      }

      res.json(segment);
    } catch (error) {
      logger.error("Error fetching segment:", error);
      throw error;
    }
  }

  // Create new segment
  static async createSegment(req: Request, res: Response) {
    try {
      const segmentData = req.body;
      const segment = await segmentService.createSegment(segmentData);
      
      res.status(201).json(segment);
    } catch (error) {
      logger.error("Error creating segment:", error);
      throw error;
    }
  }

  // Update segment
  static async updateSegment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      if (!id) {
        throw createError("Segment ID is required", 400);
      }
      
      const segment = await segmentService.updateSegment(id, updateData);
      
      if (!segment) {
        throw createError("Segment not found", 404);
      }

      res.json(segment);
    } catch (error) {
      logger.error("Error updating segment:", error);
      throw error;
    }
  }

  // Delete segment
  static async deleteSegment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw createError("Segment ID is required", 400);
      }
      
      const result = await segmentService.deleteSegment(id);
      
      if (!result) {
        throw createError("Segment not found", 404);
      }

      res.json({ message: "Segment deleted successfully" });
    } catch (error) {
      logger.error("Error deleting segment:", error);
      throw error;
    }
  }

  // Get segment statistics
  static async getSegmentStats(req: Request, res: Response) {
    try {
      const stats = await segmentService.getSegmentStats();
      res.json(stats);
    } catch (error) {
      logger.error("Error fetching segment stats:", error);
      throw error;
    }
  }

  // Add contacts to segment
  static async addContactsToSegment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { contactIds } = req.body;
      
      if (!id) {
        throw createError("Segment ID is required", 400);
      }
      
      if (!Array.isArray(contactIds)) {
        throw createError("contactIds must be an array", 400);
      }

      const result = await segmentService.addContactsToSegment(id, contactIds);
      res.json(result);
    } catch (error) {
      logger.error("Error adding contacts to segment:", error);
      throw error;
    }
  }

  // Remove contacts from segment
  static async removeContactsFromSegment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { contactIds } = req.body;
      
      if (!id) {
        throw createError("Segment ID is required", 400);
      }
      
      if (!Array.isArray(contactIds)) {
        throw createError("contactIds must be an array", 400);
      }

      const result = await segmentService.removeContactsFromSegment(id, contactIds);
      res.json(result);
    } catch (error) {
      logger.error("Error removing contacts from segment:", error);
      throw error;
    }
  }
}
