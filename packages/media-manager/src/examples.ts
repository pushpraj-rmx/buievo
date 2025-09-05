import { MediaManager, LegacyMediaManager } from "./index.js";
import {
  getStorageConfig,
  getFallbackStorageConfig,
  validateStorageConfig,
} from "./config.js";

// Example 1: Using the new configurable MediaManager
export async function exampleNewMediaManager() {
  try {
    // Get configuration from environment variables
    const primaryConfig = getStorageConfig();
    const fallbackConfig = getFallbackStorageConfig();

    // Validate configuration
    const errors = validateStorageConfig(primaryConfig);
    if (errors.length > 0) {
      throw new Error(`Configuration errors: ${errors.join(", ")}`);
    }

    // Create MediaManager with optional fallback
    const mediaManager = new MediaManager({
      storage: primaryConfig,
      fallbackStorage: fallbackConfig,
    });

    console.log("Storage info:", mediaManager.getStorageInfo());

    // Upload a file (will use primary storage, fallback if needed)
    const result = await mediaManager.upload({
      type: "image",
      fileName: "example.jpg",
      mimeType: "image/jpeg",
      data: Buffer.from("fake image data"),
    });

    console.log("Upload result:", result);

    // Get media info
    const info = await mediaManager.get(result.id);
    console.log("Media info:", info);

    // Get direct URL
    const url = await mediaManager.getUrl(result.id);
    console.log("Media URL:", url);

    // Delete media
    const deleteResult = await mediaManager.delete(result.id);
    console.log("Delete result:", deleteResult);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Example 2: Direct configuration (no environment variables)
export async function exampleDirectConfiguration() {
  try {
    // S3 configuration
    const s3Config = {
      provider: "s3" as const,
      s3: {
        bucket: "my-media-bucket",
        region: "us-east-1",
        accessKeyId: "AKIA...",
        secretAccessKey: "secret...",
      },
    };

    // WhatsApp as fallback
    const whatsappFallback = {
      provider: "whatsapp" as const,
      whatsapp: {
        baseUrl: "https://graph.facebook.com/v21.0",
        accessToken: "your-token",
        phoneNumberId: "your-phone-id",
      },
    };

    const mediaManager = new MediaManager({
      storage: s3Config,
      fallbackStorage: whatsappFallback,
    });

    console.log("Storage info:", mediaManager.getStorageInfo());

    // Use the media manager...
  } catch (error) {
    console.error("Error:", error);
  }
}

// Example 3: Local storage for development
export async function exampleLocalStorage() {
  try {
    const localConfig = {
      provider: "local" as const,
      local: {
        uploadDir: "./uploads",
        baseUrl: "http://localhost:3005/media",
      },
    };

    const mediaManager = new MediaManager({
      storage: localConfig,
    });

    console.log("Using local storage:", mediaManager.getStorageInfo());

    // Note: Local storage implementation is not yet complete
    // This will throw an error until implemented
  } catch (error) {
    console.error("Error:", error);
  }
}

// Example 4: Hybrid approach - WhatsApp for immediate use, S3 for long-term
export async function exampleHybridApproach() {
  try {
    // Primary: WhatsApp (for immediate messaging)
    const whatsappConfig = {
      provider: "whatsapp" as const,
      whatsapp: {
        baseUrl: "https://graph.facebook.com/v21.0",
        accessToken: "your-token",
        phoneNumberId: "your-phone-id",
      },
    };

    // Fallback: S3 (for long-term storage)
    const s3Fallback = {
      provider: "s3" as const,
      s3: {
        bucket: "long-term-media",
        region: "us-east-1",
        accessKeyId: "AKIA...",
        secretAccessKey: "secret...",
      },
    };

    const mediaManager = new MediaManager({
      storage: whatsappConfig,
      fallbackStorage: s3Fallback,
    });

    console.log("Hybrid storage:", mediaManager.getStorageInfo());

    // This setup allows you to:
    // 1. Use WhatsApp for immediate messaging needs
    // 2. Fall back to S3 for long-term storage
    // 3. Maintain WhatsApp integration while having reliable storage
  } catch (error) {
    console.error("Error:", error);
  }
}

// Example 5: Environment-based switching
export function exampleEnvironmentSwitching() {
  const env = process.env.NODE_ENV || "development";

  switch (env) {
    case "development":
      return {
        provider: "local" as const,
        local: {
          uploadDir: "./uploads",
          baseUrl: "http://localhost:3005/media",
        },
      };

    case "staging":
      return {
        provider: "s3" as const,
        s3: {
          bucket: "staging-media-bucket",
          region: "us-east-1",
          accessKeyId: process.env.STAGING_S3_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.STAGING_S3_SECRET_ACCESS_KEY || "",
        },
      };

    case "production":
      return {
        provider: "gcs" as const,
        gcs: {
          bucket: "production-media-bucket",
          projectId: process.env.PROD_GCS_PROJECT_ID || "",
          keyFilename: process.env.PROD_GCS_KEY_FILENAME || "",
        },
      };

    default:
      throw new Error(`Unknown environment: ${env}`);
  }
}

// Example 6: Backward compatibility
export function exampleBackwardCompatibility() {
  // Old way still works
  const legacyManager = new LegacyMediaManager({
    baseUrl: "https://graph.facebook.com/v21.0",
    accessToken: "your-token",
    phoneNumberId: "your-phone-id",
  });

  // New way with same functionality
  const newManager = new MediaManager({
    storage: {
      provider: "whatsapp",
      whatsapp: {
        baseUrl: "https://graph.facebook.com/v21.0",
        accessToken: "your-token",
        phoneNumberId: "your-phone-id",
      },
    },
  });

  // Both managers work the same way
  return { legacyManager, newManager };
}
