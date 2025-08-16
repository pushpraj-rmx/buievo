import "dotenv/config"; // 1. This MUST be the very first line
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import healthRoutes from "./routes/health.routes";
import contactRoutes from "./routes/contact.routes";
import mediaRoutes from "./routes/media.routes";
import templateRoutes from "./routes/template.routes";
import campaignRoutes from "./routes/campaign.routes";
import conversationRoutes from "./routes/conversation.routes";
import webhookRoutes from "./routes/webhook.routes";
import { redis } from "@whatssuite/redis"; // Import redis here

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()) || "*",
    credentials: true,
  })
);

async function startServer() {
  // --- ADD THIS LINE ---
  // Explicitly connect to Redis before starting the server.
  await redis.connect();
  console.log("✅ Redis client connected for publishing.");

  app.listen(port, () => {
    console.log(`API server listening at http://localhost:${port}`);
  });
}

app.get("/", (req, res) => {
  res.send("Hello from the API!");
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/contacts", contactRoutes);
app.use("/api/v1/media", mediaRoutes);
app.use("/api/v1/templates", templateRoutes);
app.use("/api/v1/campaigns", campaignRoutes);
app.use("/api/v1/conversations", conversationRoutes);
app.use("/api/v1/webhook", webhookRoutes);

startServer().catch((error) => {
  console.error("Error starting server:", error);
  process.exit(1);
});
