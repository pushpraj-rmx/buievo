import { Router } from "express";
import { ContactController } from "../controllers/contact.controller";

const router = Router();

// Get all contacts with pagination and filters
router.get("/", ContactController.getContacts);

// Get single contact by ID
router.get("/:id", ContactController.getContact);

// Create new contact
router.post("/", ContactController.createContact);

// Update contact
router.put("/:id", ContactController.updateContact);

// Delete contact
router.delete("/:id", ContactController.deleteContact);

// Bulk import contacts
router.post("/bulk-import", ContactController.bulkImportContacts);

// Export contacts
router.get("/export", ContactController.exportContacts);

// Search contacts
router.get("/search", ContactController.searchContacts);

// Get contact statistics
router.get("/stats", ContactController.getContactStats);

export { router as contactRoutes };
