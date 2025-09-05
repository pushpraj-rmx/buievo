import { Router, type IRouter } from "express";
import { ContactController } from "../controllers/contact.controller";

const router: IRouter = Router();

// Get all contacts with pagination and filters
router.get("/", ContactController.getContacts);

// Specific routes must come before parameterized routes
router.get("/export", ContactController.exportContacts);
router.get("/stats", ContactController.getContactStats);
router.get("/segments", ContactController.getAvailableSegments);

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

// Resolve duplicates from bulk import
router.post("/resolve-duplicates", ContactController.resolveDuplicates);

export { router as contactRoutes };
