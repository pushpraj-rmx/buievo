import { Router, Request, Response, NextFunction } from "express";
import {
  handleWebhook,
  testReceiveMessage,
  testSendMessage,
  debugWebhook,
} from "../controllers/webhook.controller";
import { webhookLogger, generateRequestId } from "../utils/logger";
import {
  logWebhookRequest,
  validateWebhookSignature,
} from "../utils/webhook-monitor";
import { webhookMonitor } from "../utils/webhook-status";

// Request logging middleware
const logRequest = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = generateRequestId();

  // Add request ID to request object for use in controllers
  (req as any).requestId = requestId;

  webhookLogger.info(`Request received: ${req.method} ${req.path}`, {
    requestId,
    headers: {
      "user-agent": req.headers["user-agent"],
      "content-type": req.headers["content-type"],
      "content-length": req.headers["content-length"],
      "x-forwarded-for": req.headers["x-forwarded-for"],
      "x-real-ip": req.headers["x-real-ip"],
    },
    query: req.query,
    bodySize: req.body ? JSON.stringify(req.body).length : 0,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  // Log response when it's sent
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;
    webhookLogger.info(
      `Response sent: ${req.method} ${req.path} - ${res.statusCode}`,
      {
        requestId,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        responseSize: data ? String(data).length : 0,
      },
    );
    return originalSend.call(this, data);
  };

  next();
};

// Webhook status endpoint
const getWebhookStatus = (req: Request, res: Response) => {
  const status = webhookMonitor.getStatus();
  const isHealthy = webhookMonitor.isWebhookHealthy();

  res.json({
    status: isHealthy ? "healthy" : "unhealthy",
    verification: status.verificationStatus,
    totalWebhooks: status.totalWebhooksReceived,
    lastWebhook: status.lastWebhookReceived,
    lastError: status.lastError,
    healthReport: webhookMonitor.getHealthReport(),
  });
};

const router = Router();

// Apply logging middleware to all webhook routes
router.use(logRequest);

// Apply webhook monitoring middleware
router.use(logWebhookRequest);
router.use(validateWebhookSignature);

router.post("/", handleWebhook);
router.get("/", handleWebhook); // For webhook verification
router.get("/status", getWebhookStatus); // Webhook status endpoint
router.post("/test", testReceiveMessage); // Test endpoint for simulating incoming messages
router.post("/send", testSendMessage); // Test endpoint for sending messages using phone numbers
router.post("/debug", debugWebhook); // Debug endpoint for step-by-step webhook processing

export default router;
