import "dotenv/config";
import express from "express";
import { dbConnection } from "@buievo/db";
import { redis } from "@buievo/redis";

// Import middleware
import { 
  securityMiddleware, 
  requestLogger 
} from "./middleware/security.middleware";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

// Import routes
import authRoutes from "./routes/auth.routes";
import healthRoutes from "./routes/health.routes";
import contactRoutes from "./routes/contact.routes";
import segmentRoutes from "./routes/segment.routes";
import mediaRoutes from "./routes/media.routes";
import templateRoutes from "./routes/template.routes";
import campaignRoutes from "./routes/campaign.routes";
import conversationRoutes from "./routes/conversation.routes";
import webhookRoutes from "./routes/webhook.routes";
import wabaRoutes from "./routes/waba.routes";
import configRoutes from "./routes/config.routes";

const app = express();
const port = process.env.PORT || 3001;

// Apply security middleware
const securityMiddlewares = securityMiddleware({
  enableRateLimit: true,
  enableHelmet: true,
  enableCors: true,
  rateLimitOptions: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
});

// Apply middleware in order
app.use(securityMiddlewares);
app.use(requestLogger());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint (no authentication required)
app.get("/", (req, res) => {
  res.json({
    success: true,
    data: {
      message: "buievo API is running",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    },
    meta: {
      requestId: (req as any).requestId,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    },
  });
});

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/contacts", contactRoutes);
app.use("/api/v1/segments", segmentRoutes);
app.use("/api/v1/media", mediaRoutes);
app.use("/api/v1/templates", templateRoutes);
app.use("/api/v1/campaigns", campaignRoutes);
app.use("/api/v1/conversations", conversationRoutes);
app.use("/api/v1/webhook", webhookRoutes);
app.use("/api/v1/waba", wabaRoutes);
app.use("/api/v1/config", configRoutes);

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

async function startServer() {
  try {
    // Connect to database
    await dbConnection.connect();
    console.log("✅ Database connected successfully");

    // Connect to Redis
    await redis.connect();
    console.log("✅ Redis client connected for publishing.");

    // Start the server
    app.listen(port, () => {
      console.log(`🚀 API server listening at http://localhost:${port}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 Security: Rate limiting, CORS, and Helmet enabled`);
    });
  } catch (error) {
    console.error("❌ Error starting server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  await dbConnection.disconnect();
  await redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  await dbConnection.disconnect();
  await redis.disconnect();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('💥 Uncaught Exception:', error);
  await dbConnection.disconnect();
  await redis.disconnect();
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  await dbConnection.disconnect();
  await redis.disconnect();
  process.exit(1);
});

startServer().catch((error) => {
  console.error("❌ Error starting server:", error);
  process.exit(1);
});
