// Database utilities for buievo
// Comprehensive database system with Prisma client and basic utilities

import { PrismaClient } from "@prisma/client";

// Enhanced Prisma client with logging
export const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "event",
      level: "error",
    },
    {
      emit: "event",
      level: "info",
    },
    {
      emit: "event",
      level: "warn",
    },
  ],
  errorFormat: "pretty",
});

// Database event listeners
prisma.$on("query", (e: any) => {
  console.log(`🔍 Query: ${e.query}`);
  console.log(`⏱️  Duration: ${e.duration}ms`);
});

prisma.$on("error", (e: any) => {
  console.error(`❌ Database Error:`, e);
});

prisma.$on("info", (e: any) => {
  console.info(`ℹ️  Database Info:`, e);
});

prisma.$on("warn", (e: any) => {
  console.warn(`⚠️  Database Warning:`, e);
});

// Connection management
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected = false;

  private constructor() {}

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await prisma.$connect();
      this.isConnected = true;
      console.log("✅ Database connected successfully");
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await prisma.$disconnect();
      this.isConnected = false;
      console.log("✅ Database disconnected successfully");
    } catch (error) {
      console.error("❌ Database disconnection failed:", error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error("❌ Database health check failed:", error);
      return false;
    }
  }

  isConnectedStatus(): boolean {
    return this.isConnected;
  }
}

// Export the connection manager
export const dbConnection = DatabaseConnection.getInstance();

// Graceful shutdown
process.on("beforeExit", async () => {
  await dbConnection.disconnect();
});

process.on("SIGINT", async () => {
  await dbConnection.disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await dbConnection.disconnect();
  process.exit(0);
});

// Helper functions
export async function ensureConnection(): Promise<void> {
  await dbConnection.connect();
}

export async function checkDatabaseHealth(): Promise<boolean> {
  return dbConnection.healthCheck();
}

// Re-export all types and enums from the Prisma client
export * from "@prisma/client";
