import { Router } from "express";
import { handleWebhook, testReceiveMessage } from "../controllers/webhook.controller";

const router = Router();

router.post("/", handleWebhook);
router.get("/", handleWebhook); // For webhook verification
router.post("/test", testReceiveMessage); // Test endpoint for simulating incoming messages

export default router;
