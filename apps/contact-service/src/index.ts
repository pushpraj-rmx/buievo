import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { contactRoutes } from "./routes/contact.routes";
import { segmentRoutes } from "./routes/segment.routes";
import { healthRoutes } from "./routes/health.routes";
import { errorHandler } from "./middleware/error-handler";
import { logger } from "./utils/logger";

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.CONTACT_SERVICE_PORT || 32102;

// Middleware
app.use(helmet());

// CORS configuration - allow specific origins for development
app.use(cors({
  origin: [
    'http://localhost:32100', // Admin frontend
    'http://localhost:3000',  // Web frontend
    'http://localhost:4000',  // Alternative admin port
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Origin", "X-Requested-With", "Accept"],
  optionsSuccessStatus: 200
}));

app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.json({
    service: "Contact Management Service",
    version: "1.0.0",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/v1/contacts", contactRoutes);
app.use("/api/v1/segments", segmentRoutes);
app.use("/health", healthRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Contact Service running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`📚 API docs: http://localhost:${PORT}/api/v1`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Global error handlers to prevent crashes
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

export default app;
