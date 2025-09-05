import { Request, Response, NextFunction } from "express";
import { ContactService } from "../services/contact.service";
import { SegmentService } from "../services/segment.service";
import { createError } from "../middleware/error-handler";
import { logger } from "../utils/logger";

const contactService = new ContactService();
const segmentService = new SegmentService();

export class ContactController {
  // Get all contacts with pagination and advanced filters
  static async getContacts(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        page = 1, 
        limit = 10, 
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
      } = req.query;
      
      const result = await contactService.getContacts({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        name: name as string,
        email: email as string,
        phone: phone as string,
        comment: comment as string,
        status: status as string,
        segmentId: segmentId as string,
        createdAfter: createdAfter as string,
        createdBefore: createdBefore as string,
        updatedAfter: updatedAfter as string,
        updatedBefore: updatedBefore as string,
      });

      res.json(result);
    } catch (error) {
      logger.error("Error fetching contacts:", error);
      const appError = createError("Failed to fetch contacts", 500);
      return next(appError);
    }
  }

  // Get single contact by ID
  static async getContact(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      if (!id) {
        const error = createError("Contact ID is required", 400);
        return next(error);
      }
      
      const contact = await contactService.getContactById(id);
      
      if (!contact) {
        const error = createError("Contact not found", 404);
        return next(error);
      }

      res.json(contact);
    } catch (error) {
      logger.error("Error fetching contact:", error);
      return next(error);
    }
  }

  // Create new contact
  static async createContact(req: Request, res: Response, next: NextFunction) {
    try {
      const contactData = req.body;
      const contact = await contactService.createContact(contactData);
      
      res.status(201).json(contact);
    } catch (error) {
      logger.error("Error creating contact:", error);
      return next(error);
    }
  }

  // Update contact
  static async updateContact(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      if (!id) {
        const error = createError("Contact ID is required", 400);
        return next(error);
      }
      
      const contact = await contactService.updateContact(id, updateData);
      
      if (!contact) {
        const error = createError("Contact not found", 404);
        return next(error);
      }

      res.json(contact);
    } catch (error) {
      logger.error("Error updating contact:", error);
      return next(error);
    }
  }

  // Delete contact
  static async deleteContact(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      if (!id) {
        const error = createError("Contact ID is required", 400);
        return next(error);
      }
      
      const result = await contactService.deleteContact(id);
      
      if (!result) {
        const error = createError("Contact not found", 404);
        return next(error);
      }

      res.json({ message: "Contact deleted successfully" });
    } catch (error) {
      logger.error("Error deleting contact:", error);
      return next(error);
    }
  }

  // Bulk import contacts
  static async bulkImportContacts(req: Request, res: Response, next: NextFunction) {
    try {
      const { contacts, segmentIds } = req.body;
      
      if (!Array.isArray(contacts)) {
        const error = createError("Contacts must be an array", 400);
        return next(error);
      }

      const result = await contactService.bulkImportContacts(contacts, segmentIds);
      
      res.status(201).json(result);
    } catch (error) {
      logger.error("Error bulk importing contacts:", error);
      return next(error);
    }
  }

  // Resolve duplicates from bulk import
  static async resolveDuplicates(req: Request, res: Response, next: NextFunction) {
    try {
      const { duplicates, action, segmentIds } = req.body;
      
      if (!Array.isArray(duplicates)) {
        const error = createError("Duplicates must be an array", 400);
        return next(error);
      }

      if (!['update', 'skip', 'force-create'].includes(action)) {
        const error = createError("Action must be 'update', 'skip', or 'force-create'", 400);
        return next(error);
      }

      const result = await contactService.resolveDuplicates(duplicates, action, segmentIds);
      
      res.json(result);
    } catch (error) {
      logger.error("Error resolving duplicates:", error);
      return next(error);
    }
  }

  // Export contacts
  static async exportContacts(req: Request, res: Response, next: NextFunction) {
    try {
      const { format = "csv", segmentId, status } = req.query;
      
      const result = await contactService.exportContacts({
        format: format as string,
        segmentId: segmentId as string,
        status: status as string,
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=contacts.csv");
      res.send(result);
    } catch (error) {
      logger.error("Error exporting contacts:", error);
      return next(error);
    }
  }


  // Get contact statistics
  static async getContactStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await contactService.getContactStats();
      res.json(stats);
    } catch (error) {
      logger.error("Error fetching contact stats:", error);
      return next(error);
    }
  }

  // Get available segments for contacts
  static async getAvailableSegments(req: Request, res: Response, next: NextFunction) {
    try {
      const segments = await segmentService.getSegments();
      res.json(segments);
    } catch (error) {
      logger.error("Error fetching available segments:", error);
      return next(error);
    }
  }
}
