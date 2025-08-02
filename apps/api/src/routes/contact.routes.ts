import { Router } from "express";
import {
  sendMessageToContact,
  sendMessageToNumber,
} from "../controllers/contact.controller";

const router = Router();

router.post("/:id/send-message", sendMessageToContact);
router.post("/send-message", sendMessageToNumber);

export default router;
