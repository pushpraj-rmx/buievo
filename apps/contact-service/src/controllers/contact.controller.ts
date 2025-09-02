import { Request, Response } from "express";
import { ContactService } from "../services/contact.service";
import { createError } from "../middleware/error-handler";
import { logger } from "../utils/logger";

const contactService = new ContactService();

export class ContactController {
  // Get all contacts with pagination and filters
  static async getContacts(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, search, status, segmentId } = req.query;
      
      const result = await contactService.getContacts({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        status: status as string,
        segmentId: segmentId as string,
      });

      res.json(result);
    } catch (error) {
      logger.error("Error fetching contacts:", error);
      throw createError("Failed to fetch contacts", 500);
    }
  }

  // Get single contact by ID
  static async getContact(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw createError("Contact ID is required", 400);
      }
      
      const contact = await contactService.getContactById(id);
      
      if (!contact) {
        throw createError("Contact not found", 404);
      }

      res.json(contact);
    } catch (error) {
      logger.error("Error fetching contact:", error);
      throw error;
    }
  }

  // Create new contact
  static async createContact(req: Request, res: Response) {
    try {
      const contactData = req.body;
      const contact = await contactService.createContact(contactData);
      
      res.status(201).json(contact);
    } catch (error) {
      logger.error("Error creating contact:", error);
      throw error;
    }
  }

  // Update contact
  static async updateContact(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      if (!id) {
        throw createError("Contact ID is required", 400);
      }
      
      const contact = await contactService.updateContact(id, updateData);
      
      if (!contact) {
        throw createError("Contact not found", 404);
      }

      res.json(contact);
    } catch (error) {
      logger.error("Error updating contact:", error);
      throw error;
    }
  }

  // Delete contact
  static async deleteContact(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw createError("Contact ID is required", 400);
      }
      
      const result = await contactService.deleteContact(id);
      
      if (!result) {
        throw createError("Contact not found", 404);
      }

      res.json({ message: "Contact deleted successfully" });
    } catch (error) {
      logger.error("Error deleting contact:", error);
      throw error;
    }
  }

  // Bulk import contacts
  static async bulkImportContacts(req: Request, res: Response) {
    try {
      const { contacts, segmentIds } = req.body;
      
      if (!Array.isArray(contacts)) {
        throw createError("Contacts must be an array", 400);
      }

      const result = await contactService.bulkImportContacts(contacts, segmentIds);
      
      res.status(201).json(result);
    } catch (error) {
      logger.error("Error bulk importing contacts:", error);
      throw error;
    }
  }

  // Export contacts
  static async exportContacts(req: Request, res: Response) {
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
      throw error;
    }
  }

  // Search contacts
  static async searchContacts(req: Request, res: Response) {
    try {
      const { q, limit = 10 } = req.query;
      
      if (!q) {
        throw createError("Search query is required", 400);
      }

      const contacts = await contactService.searchContacts(q as string, Number(limit));
      
      res.json(contacts);
    } catch (error) {
      logger.error("Error searching contacts:", error);
      throw error;
    }
  }

  // Get contact statistics
  static async getContactStats(req: Request, res: Response) {
    try {
      const stats = await contactService.getContactStats();
      res.json(stats);
    } catch (error) {
      logger.error("Error fetching contact stats:", error);
      throw error;
    }
  }
}
