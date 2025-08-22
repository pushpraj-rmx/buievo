import { createClient, RedisClientType } from "redis";

// --- ADD THIS DEBUG LINE ---
console.log(
  `[redis-client] Attempting to connect with URL: ${process.env.REDIS_URL}`,
);

export const redis: RedisClientType = createClient({
  url: process.env.REDIS_URL,
});

redis.on("error", (err) => {
  console.error("❌ Redis client error", err);
});

// redis.connect(); -- connecting is handled in the app files
