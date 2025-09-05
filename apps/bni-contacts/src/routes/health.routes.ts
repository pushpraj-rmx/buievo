import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// Health check endpoint
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'bni-contacts',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
    },
    meta: {
      requestId: (req as any).requestId,
      timestamp: new Date().toISOString(),
    },
  });
}));

// Detailed health check
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const healthData = {
    status: 'healthy',
    service: 'bni-contacts',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
    version: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    uptimeFormatted: formatUptime(process.uptime()),
  };

  res.json({
    success: true,
    data: healthData,
    meta: {
      requestId: (req as any).requestId,
      timestamp: new Date().toISOString(),
    },
  });
}));

// Readiness check
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  // Add any readiness checks here (e.g., database connectivity)
  const isReady = true; // You can add actual checks here
  
  if (isReady) {
    res.json({
      success: true,
      data: {
        status: 'ready',
        service: 'bni-contacts',
        timestamp: new Date().toISOString(),
      },
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } else {
    res.status(503).json({
      success: false,
      error: {
        message: 'Service not ready',
        statusCode: 503,
        requestId: (req as any).requestId,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
}));

// Liveness check
router.get('/live', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'alive',
      service: 'bni-contacts',
      timestamp: new Date().toISOString(),
    },
    meta: {
      requestId: (req as any).requestId,
      timestamp: new Date().toISOString(),
    },
  });
}));

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

export default router;

