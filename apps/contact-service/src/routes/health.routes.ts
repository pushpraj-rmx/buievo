import { Router, type IRouter } from "express";
import { PrismaClient } from "@prisma/client";

const router: IRouter = Router();
const prisma = new PrismaClient();

// Basic health check
router.get("/", (req, res) => {
  res.json({
    status: "healthy",
    service: "contact-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Detailed health check with database connectivity
router.get("/detailed", async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: "healthy",
      service: "contact-service",
      database: "connected",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      service: "contact-service",
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
});

// Readiness check
router.get("/ready", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready" });
  } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
    res.status(503).json({ status: "not ready" });
  }
});

// Liveness check
router.get("/live", (req, res) => {
  res.json({ status: "alive" });
});

export { router as healthRoutes };
