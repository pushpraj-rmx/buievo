import { redis } from "@whatssuite/redis";
import { Router, Request, Response } from "express";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    await redis.ping();
    res.status(200).json({
      status: "UP",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    res.status(500).json({
      status: "DOWN",
      timestamp: new Date().toISOString(),
      error: errorMessage,
    });
  }
});

export default router;
