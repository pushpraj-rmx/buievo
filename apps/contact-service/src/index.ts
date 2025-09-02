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
const PORT = process.env.CONTACT_SERVICE_PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000", "http://localhost:3002"],
  credentials: true,
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

export default app;
