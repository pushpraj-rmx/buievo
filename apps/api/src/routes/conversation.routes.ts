import { Router } from "express";
import {
  getConversations,
  getConversation,
  sendMessage,
  markAsRead,
} from "../controllers/conversation.controller";

const router = Router();

// Get all conversations
router.get("/", getConversations);

// Get a single conversation with messages
router.get("/:contactId", getConversation);

// Send a message to a contact
router.post("/:contactId/messages", sendMessage);

// Mark conversation as read
router.post("/:contactId/read", markAsRead);

export default router;
