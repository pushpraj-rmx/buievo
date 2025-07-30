import { Router } from "express";
import { sendMessageToContact } from "../controllers/contact.controller";

const router = Router();

router.post("/:id/send-message", sendMessageToContact);

export default router;
