import { Request, Response, NextFunction } from "express";
import { SegmentService } from "../services/segment.service";
import { createError } from "../middleware/error-handler";
import { logger } from "../utils/logger";

const segmentService = new SegmentService();

export class SegmentController {
  // Get all segments
  static async getSegments(req: Request, res: Response, next: NextFunction) {
    try {
      const segments = await segmentService.getSegments();
      res.json(segments);
    } catch (error) {
      logger.error("Error fetching segments:", error);
      const appError = createError("Failed to fetch segments", 500);
      return next(appError);
    }
  }

  // Get single segment by ID
  static async getSegment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      if (!id) {
        const error = createError("Segment ID is required", 400);
        return next(error);
      }
      
      const segment = await segmentService.getSegmentById(id);
      
      if (!segment) {
        const error = createError("Segment not found", 404);
        return next(error);
      }

      res.json(segment);
    } catch (error) {
      logger.error("Error fetching segment:", error);
      return next(error);
    }
  }

  // Create new segment
  static async createSegment(req: Request, res: Response, next: NextFunction) {
    try {
      const segmentData = req.body;
      const segment = await segmentService.createSegment(segmentData);
      
      res.status(201).json(segment);
    } catch (error) {
      logger.error("Error creating segment:", error);
      return next(error);
    }
  }

  // Update segment
  static async updateSegment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      if (!id) {
        const error = createError("Segment ID is required", 400);
        return next(error);
      }
      
      const segment = await segmentService.updateSegment(id, updateData);
      
      if (!segment) {
        const error = createError("Segment not found", 404);
        return next(error);
      }

      res.json(segment);
    } catch (error) {
      logger.error("Error updating segment:", error);
      return next(error);
    }
  }

  // Delete segment
  static async deleteSegment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      if (!id) {
        const error = createError("Segment ID is required", 400);
        return next(error);
      }
      
      const result = await segmentService.deleteSegment(id);
      
      if (!result) {
        const error = createError("Segment not found", 404);
        return next(error);
      }

      res.json({ message: "Segment deleted successfully" });
    } catch (error) {
      logger.error("Error deleting segment:", error);
      return next(error);
    }
  }

  // Get segment statistics
  static async getSegmentStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await segmentService.getSegmentStats();
      res.json(stats);
    } catch (error) {
      logger.error("Error fetching segment stats:", error);
      const appError = createError("Failed to fetch segment stats", 500);
      return next(appError);
    }
  }

  // Add contacts to segment
  static async addContactsToSegment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { contactIds } = req.body;
      
      if (!id) {
        const error = createError("Segment ID is required", 400);
        return next(error);
      }
      
      if (!Array.isArray(contactIds)) {
        const error = createError("contactIds must be an array", 400);
        return next(error);
      }

      const result = await segmentService.addContactsToSegment(id, contactIds);
      res.json(result);
    } catch (error) {
      logger.error("Error adding contacts to segment:", error);
      return next(error);
    }
  }

  // Remove contacts from segment
  static async removeContactsFromSegment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { contactIds } = req.body;
      
      if (!id) {
        const error = createError("Segment ID is required", 400);
        return next(error);
      }
      
      if (!Array.isArray(contactIds)) {
        const error = createError("contactIds must be an array", 400);
        return next(error);
      }

      const result = await segmentService.removeContactsFromSegment(id, contactIds);
      res.json(result);
    } catch (error) {
      logger.error("Error removing contacts from segment:", error);
      return next(error);
    }
  }
}
