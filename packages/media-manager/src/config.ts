import { StorageConfig } from "./index.js";

// Environment-based configuration
export function getStorageConfig(): StorageConfig {
  const provider = process.env.MEDIA_STORAGE_PROVIDER || "whatsapp";

  switch (provider) {
    case "whatsapp":
      return {
        provider: "whatsapp",
        whatsapp: {
          baseUrl:
            process.env.META_API_BASE_URL || "https://graph.facebook.com/v21.0",
          accessToken: process.env.ACCESS_TOKEN || "",
          phoneNumberId: process.env.PHONE_NUMBER_ID || "",
        },
      };

    case "local":
      return {
        provider: "local",
        local: {
          uploadDir: process.env.LOCAL_UPLOAD_DIR || "./uploads",
          baseUrl: process.env.LOCAL_BASE_URL || "http://localhost:3005/media",
        },
      };

    case "s3":
      return {
        provider: "s3",
        s3: {
          bucket: process.env.S3_BUCKET || "",
          region: process.env.S3_REGION || "us-east-1",
          accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
          endpoint: process.env.S3_ENDPOINT, // Optional, for custom S3-compatible services
        },
      };

    case "gcs":
      return {
        provider: "gcs",
        gcs: {
          bucket: process.env.GCS_BUCKET || "",
          projectId: process.env.GCS_PROJECT_ID || "",
          keyFilename: process.env.GCS_KEY_FILENAME, // Optional: path to service account key file
          credentials: process.env.GCS_CREDENTIALS
            ? JSON.parse(process.env.GCS_CREDENTIALS)
            : undefined, // Optional: direct credentials
        },
      };

    default:
      throw new Error(`Unsupported storage provider: ${provider}`);
  }
}

// Fallback configuration (optional)
export function getFallbackStorageConfig(): StorageConfig | undefined {
  const fallbackProvider = process.env.MEDIA_FALLBACK_STORAGE_PROVIDER;

  if (!fallbackProvider) return undefined;

  // Create a new config with the fallback provider
  const config = getStorageConfig();
  config.provider = fallbackProvider as StorageConfig["provider"];

  // Override with fallback-specific environment variables
  switch (fallbackProvider) {
    case "whatsapp":
      config.whatsapp = {
        baseUrl:
          process.env.FALLBACK_META_API_BASE_URL ||
          config.whatsapp?.baseUrl ||
          "",
        accessToken:
          process.env.FALLBACK_ACCESS_TOKEN ||
          config.whatsapp?.accessToken ||
          "",
        phoneNumberId:
          process.env.FALLBACK_PHONE_NUMBER_ID ||
          config.whatsapp?.phoneNumberId ||
          "",
      };
      break;

    case "local":
      config.local = {
        uploadDir:
          process.env.FALLBACK_LOCAL_UPLOAD_DIR ||
          config.local?.uploadDir ||
          "./uploads",
        baseUrl:
          process.env.FALLBACK_LOCAL_BASE_URL ||
          config.local?.baseUrl ||
          "http://localhost:3005/media",
      };
      break;

    case "s3":
      config.s3 = {
        bucket: process.env.FALLBACK_S3_BUCKET || config.s3?.bucket || "",
        region:
          process.env.FALLBACK_S3_REGION || config.s3?.region || "us-east-1",
        accessKeyId:
          process.env.FALLBACK_S3_ACCESS_KEY_ID || config.s3?.accessKeyId || "",
        secretAccessKey:
          process.env.FALLBACK_S3_SECRET_ACCESS_KEY ||
          config.s3?.secretAccessKey ||
          "",
        endpoint: process.env.FALLBACK_S3_ENDPOINT || config.s3?.endpoint,
      };
      break;

    case "gcs":
      config.gcs = {
        bucket: process.env.FALLBACK_GCS_BUCKET || config.gcs?.bucket || "",
        projectId:
          process.env.FALLBACK_GCS_PROJECT_ID || config.gcs?.projectId || "",
        keyFilename:
          process.env.FALLBACK_GCS_KEY_FILENAME || config.gcs?.keyFilename,
        credentials: process.env.FALLBACK_GCS_CREDENTIALS
          ? JSON.parse(process.env.FALLBACK_GCS_CREDENTIALS)
          : config.gcs?.credentials,
      };
      break;
  }

  return config;
}

// Configuration validation
export function validateStorageConfig(config: StorageConfig): string[] {
  const errors: string[] = [];

  switch (config.provider) {
    case "whatsapp":
      if (!config.whatsapp?.accessToken)
        errors.push("WhatsApp access token is required");
      if (!config.whatsapp?.phoneNumberId)
        errors.push("WhatsApp phone number ID is required");
      break;

    case "local":
      if (!config.local?.uploadDir)
        errors.push("Local upload directory is required");
      if (!config.local?.baseUrl) errors.push("Local base URL is required");
      break;

    case "s3":
      if (!config.s3?.bucket) errors.push("S3 bucket is required");
      if (!config.s3?.accessKeyId) errors.push("S3 access key ID is required");
      if (!config.s3?.secretAccessKey)
        errors.push("S3 secret access key is required");
      break;

    case "gcs":
      if (!config.gcs?.bucket) errors.push("GCS bucket is required");
      if (!config.gcs?.projectId) errors.push("GCS project ID is required");
      if (!config.gcs?.keyFilename && !config.gcs?.credentials) {
        errors.push("GCS key filename or credentials are required");
      }
      break;
  }

  return errors;
}

// Example configuration for different environments
export const exampleConfigs = {
  development: {
    provider: "local" as const,
    local: {
      uploadDir: "./uploads",
      baseUrl: "http://localhost:3005/media",
    },
  },

  production: {
    provider: "s3" as const,
    s3: {
      bucket: "my-media-bucket",
      region: "us-east-1",
      accessKeyId: "AKIA...",
      secretAccessKey: "secret...",
    },
  },

  hybrid: {
    provider: "whatsapp" as const,
    whatsapp: {
      baseUrl: "https://graph.facebook.com/v21.0",
      accessToken: "your-token",
      phoneNumberId: "your-phone-id",
    },
  },
};
