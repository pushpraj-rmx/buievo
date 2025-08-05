import "dotenv/config"; // 1. This MUST be the very first line
import express from "express";
import authRoutes from "./routes/auth.routes";
import healthRoutes from "./routes/health.routes";
import contactRoutes from "./routes/contact.routes";
import { redis } from "@whatssuite/redis"; // Import redis here

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

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

startServer().catch((error) => {
  console.error("Error starting server:", error);
  process.exit(1);
});
