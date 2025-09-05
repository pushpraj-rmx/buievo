import "dotenv/config";
import express from "express";
import { dbConnection } from "@buievo/db";

// Import middleware
import { 
  securityMiddleware, 
  requestLogger 
} from "./middleware/security.middleware";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

// Import routes
import healthRoutes from "./routes/health.routes";
import contactRoutes from "./routes/contact.routes";

const app = express();

const port = process.env.PORT || 5002;

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
      message: "BNI Contacts API is running",
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
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/contacts", contactRoutes);

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

async function startServer() {
  try {
    // Connect to database
    await dbConnection.connect();
    console.log("✅ Database connected successfully");

    // Start the server
    app.listen(port, () => {
      console.log(`🚀 BNI Contacts API server listening at http://localhost:${port}`);
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
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  await dbConnection.disconnect();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('💥 Uncaught Exception:', error);
  await dbConnection.disconnect();
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  await dbConnection.disconnect();
  process.exit(1);
});

startServer().catch((error) => {
  console.error("❌ Error starting server:", error);
  process.exit(1);
});

