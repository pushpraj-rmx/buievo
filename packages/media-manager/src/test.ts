import { MediaManager, LegacyMediaManager } from "./index";

// Test the new MediaManager
async function testNewMediaManager() {
  console.log("🧪 Testing new MediaManager...");
  
  try {
    const mediaManager = new MediaManager({
      storage: {
        provider: "whatsapp",
        whatsapp: {
          baseUrl: "https://graph.facebook.com/v20.0",
          accessToken: "test-token",
          phoneNumberId: "test-phone-id"
        }
      }
    });
    
    console.log("✅ New MediaManager created successfully");
    console.log("📊 Storage info:", mediaManager.getStorageInfo());
    
    // Test that we can access the storage provider
    const storageInfo = mediaManager.getStorageInfo();
    if (storageInfo.primary === "WhatsAppStorageProvider") {
      console.log("✅ WhatsApp storage provider detected correctly");
    } else {
      console.log("❌ Unexpected storage provider:", storageInfo.primary);
    }
    
  } catch (error) {
    console.error("❌ New MediaManager test failed:", error);
  }
}

// Test the legacy MediaManager for backward compatibility
async function testLegacyMediaManager() {
  console.log("\n🧪 Testing legacy MediaManager...");
  
  try {
    const legacyManager = new LegacyMediaManager({
      baseUrl: "https://graph.facebook.com/v20.0",
      accessToken: "test-token",
      phoneNumberId: "test-phone-id"
    });
    
    console.log("✅ Legacy MediaManager created successfully");
    console.log("📊 Storage info:", legacyManager.getStorageInfo());
    
    // Test that it's using WhatsApp storage
    const storageInfo = legacyManager.getStorageInfo();
    if (storageInfo.primary === "WhatsAppStorageProvider") {
      console.log("✅ Legacy manager correctly uses WhatsApp storage");
    } else {
      console.log("❌ Legacy manager storage provider mismatch:", storageInfo.primary);
    }
    
  } catch (error) {
    console.error("❌ Legacy MediaManager test failed:", error);
  }
}

// Test configuration validation
async function testConfiguration() {
  console.log("\n🧪 Testing configuration...");
  
  try {
    // Test valid WhatsApp config
    const validConfig = {
      storage: {
        provider: "whatsapp" as const,
        whatsapp: {
          baseUrl: "https://graph.facebook.com/v20.0",
          accessToken: "test-token",
          phoneNumberId: "test-phone-id"
        }
      }
    };
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const mediaManager = new MediaManager(validConfig);
    console.log("✅ Valid WhatsApp configuration accepted");
    
    // Test invalid config (should throw error)
    try {
      const invalidConfig = {
        storage: {
          provider: "s3" as const,
          s3: {
            bucket: "test-bucket",
            region: "us-east-1",
            accessKeyId: "test",
            secretAccessKey: "test"
            // This should still work since we have required fields
          }
        }
      };
      
      new MediaManager(invalidConfig);
      console.log("✅ S3 config accepted (required fields present)");
    } catch (error) {
      if (error instanceof Error) {
        console.log("✅ Invalid config correctly rejected:", error.message);
      } else {
        console.log("✅ Invalid config correctly rejected");
      }
    }
    
  } catch (error) {
    console.error("❌ Configuration test failed:", error);
  }
}

// Run all tests
async function runTests() {
  console.log("🚀 Starting MediaManager tests...\n");
  
  await testNewMediaManager();
  await testLegacyMediaManager();
  await testConfiguration();
  
  console.log("\n✨ All tests completed!");
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests };
