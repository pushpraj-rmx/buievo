import { Router } from "express";
import { prisma } from "@buievo/db";

const router = Router();

// GET /api/v1/config - Get all configuration
router.get("/", async (req, res) => {
  try {
    // Try to get configuration from database first
    let config: any = null;
    
    try {
      // For now, get the first configuration (in future, filter by organizationId)
      // Note: This requires the Configuration model to be added to the Prisma schema
      // const dbConfig = await prisma.configuration.findFirst({
      //   orderBy: { updatedAt: 'desc' }
      // });
      
      // For now, skip database lookup until schema is updated
      const dbConfig: any = null;
      
      if (dbConfig && dbConfig.config) {
        config = dbConfig.config;
      }
    } catch (dbError) {
      console.warn("Database not available, using default config:", dbError);
    }

    // If no config in database, use default
    if (!config) {
      config = {
      whatsapp: {
        phoneNumberId: process.env.PHONE_NUMBER_ID || "",
        accessToken: process.env.ACCESS_TOKEN || "",
        wabaId: process.env.WABA_ID || "",
        webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN || "",
        apiVersion: process.env.META_API_VERSION || "v21.0",
        isEnabled: true,
      },
      storage: {
        provider: "whatsapp",
        maxFileSize: 16,
        retentionDays: 30,
        compressionEnabled: true,
        allowedTypes: [
          "image/jpeg",
          "image/png",
          "image/gif",
          "video/mp4",
          "application/pdf",
          "text/plain"
        ],
      },
      api: {
        corsOrigin: "*",
        rateLimit: 100,
        webhookUrl: "",
        apiKey: "",
        enableSwagger: true,
      },
      notifications: {
        emailNotifications: true,
        webhookNotifications: false,
        campaignAlerts: true,
        errorAlerts: true,
        emailAddress: "",
      },
      workerArea: {
        autoOpen: true,
        showNotifications: true,
        maxHistoryItems: 50,
        autoClearCompleted: false,
        clearAfterDays: 7,
      },
      theme: {
        mode: "system",
        primaryColor: "#3b82f6",
        accentColor: "#8b5cf6",
      },
      sidebar: {
        width: "16rem",
        collapsible: true,
        position: "left",
        defaultCollapsed: false,
      },
      localization: {
        language: "en",
        dateFormat: "MM/dd/yyyy",
        timeFormat: "HH:mm",
        timezone: "UTC",
        numberFormat: "en-US",
      },
      advancedStorage: {
        fallbackProvider: null,
        enableFallback: false,
        retryAttempts: 3,
        retryDelay: 1000,
      },
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
    };
    }

    res.json(config);
  } catch (error) {
    console.error("Error fetching configuration:", error);
    res.status(500).json({ error: "Failed to fetch configuration" });
  }
});

// POST /api/v1/config - Save configuration
router.post("/", async (req, res) => {
  try {
    const config = req.body;

    // Validate the configuration structure
    if (!config || typeof config !== "object") {
      return res.status(400).json({ error: "Invalid configuration data" });
    }

    // For now, just log the configuration
    // In the future, this could be stored in the database
    console.log("Configuration saved:", JSON.stringify(config, null, 2));

    // You could store this in a database table like:
    // await prisma.configuration.upsert({
    //   where: { organizationId: req.user.organizationId },
    //   update: { config: config },
    //   create: { organizationId: req.user.organizationId, config: config }
    // });

    res.json({ message: "Configuration saved successfully", config });
  } catch (error) {
    console.error("Error saving configuration:", error);
    res.status(500).json({ error: "Failed to save configuration" });
  }
});

// POST /api/v1/whatsapp/test - Test WhatsApp connection
router.post("/whatsapp/test", async (req, res) => {
  try {
    const { phoneNumberId, accessToken, wabaId } = req.body;

    // Validate required fields
    if (!phoneNumberId || !accessToken || !wabaId) {
      return res.status(400).json({ 
        error: "Missing required fields: phoneNumberId, accessToken, wabaId" 
      });
    }

    // Test WhatsApp API connection
    const testUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}`;
    
    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      res.json({ 
        success: true, 
        message: "WhatsApp connection successful",
        data 
      });
    } else {
      const errorData = await response.json();
      res.status(400).json({ 
        success: false, 
        error: "WhatsApp connection failed",
        details: errorData 
      });
    }
  } catch (error) {
    console.error("WhatsApp connection test error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to test WhatsApp connection" 
    });
  }
});

// GET /api/v1/config/validate - Validate configuration
router.get("/validate", async (req, res) => {
  try {
    // This endpoint could validate the current configuration
    // and return any issues found
    
    const validationResult: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
    } = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Example validation logic
    const config = req.query.config ? JSON.parse(req.query.config as string) : {};

    if (config.whatsapp?.isEnabled) {
      if (!config.whatsapp.phoneNumberId) {
        validationResult.errors.push("WhatsApp Phone Number ID is required when enabled");
        validationResult.isValid = false;
      }
      if (!config.whatsapp.accessToken) {
        validationResult.errors.push("WhatsApp Access Token is required when enabled");
        validationResult.isValid = false;
      }
    }

    if (config.storage?.maxFileSize <= 0) {
      validationResult.errors.push("Maximum file size must be greater than 0");
      validationResult.isValid = false;
    }

    res.json(validationResult);
  } catch (error) {
    console.error("Configuration validation error:", error);
    res.status(500).json({ error: "Failed to validate configuration" });
  }
});

export default router;
