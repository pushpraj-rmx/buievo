import { Router } from "express";
import {
  sendMessageToContact,
  sendMessageToNumber,
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  bulkImportContacts,
  getSegments,
  createSegment,
  updateSegment,
  deleteSegment,
} from "../controllers/contact.controller";

const router = Router();

// Contact CRUD operations
router.get("/", getContacts);
router.post("/", createContact);
router.post("/bulk-import", bulkImportContacts);

// Segment CRUD operations
router.get("/segments", getSegments);
router.post("/segments", createSegment);
router.put("/segments/:id", updateSegment);
router.delete("/segments/:id", deleteSegment);

// Contact CRUD operations (specific ID)
router.get("/:id", getContact);
router.put("/:id", updateContact);
router.delete("/:id", deleteContact);

// Message sending (existing)
router.post("/:id/send-message", sendMessageToContact);
router.post("/send-message", sendMessageToNumber);

export default router;
