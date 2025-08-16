# Media Manager - Configurable Storage System

A flexible media management system that supports multiple storage backends including WhatsApp Business API, local storage, Amazon S3, and Google Cloud Storage.

## 🚀 Features

- **Multiple Storage Providers**: WhatsApp, Local, S3, GCS
- **Fallback Support**: Automatic fallback if primary storage fails
- **Environment-based Configuration**: Easy switching between environments
- **Type Safety**: Full TypeScript support
- **Backward Compatibility**: Existing code continues to work
- **Validation**: Configuration validation and error handling

## 📦 Installation

```bash
pnpm add @whatssuite/media-manager
```

## 🔧 Configuration

### Environment Variables

Set `MEDIA_STORAGE_PROVIDER` to choose your storage backend:

```bash
# WhatsApp (default)
MEDIA_STORAGE_PROVIDER=whatsapp
ACCESS_TOKEN=your_whatsapp_token
PHONE_NUMBER_ID=your_phone_number_id

# Local Storage
MEDIA_STORAGE_PROVIDER=local
LOCAL_UPLOAD_DIR=./uploads
LOCAL_BASE_URL=http://localhost:3001/media

# Amazon S3
MEDIA_STORAGE_PROVIDER=s3
S3_BUCKET=my-media-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=AKIA...
S3_SECRET_ACCESS_KEY=secret...

# Google Cloud Storage
MEDIA_STORAGE_PROVIDER=gcs
GCS_BUCKET=my-media-bucket
GCS_PROJECT_ID=my-project
GCS_KEY_FILENAME=./service-account-key.json
```

### Fallback Storage

Optionally configure fallback storage:

```bash
MEDIA_FALLBACK_STORAGE_PROVIDER=s3
FALLBACK_S3_BUCKET=backup-bucket
FALLBACK_S3_REGION=us-east-1
FALLBACK_S3_ACCESS_KEY_ID=AKIA...
FALLBACK_S3_SECRET_ACCESS_KEY=secret...
```

## 💻 Usage

### Basic Usage

```typescript
import { MediaManager } from "@whatssuite/media-manager";
import { getStorageConfig } from "@whatssuite/media-manager/config";

// Get configuration from environment
const config = getStorageConfig();
const mediaManager = new MediaManager({ storage: config });

// Upload media
const result = await mediaManager.upload({
  type: "image",
  fileName: "photo.jpg",
  mimeType: "image/jpeg",
  data: fileBuffer,
});

// Get media info
const info = await mediaManager.get(result.id);

// Get media URL
const url = await mediaManager.getUrl(result.id);

// Delete media
await mediaManager.delete(result.id);
```

### Direct Configuration

```typescript
import { MediaManager } from "@whatssuite/media-manager";

const mediaManager = new MediaManager({
  storage: {
    provider: "s3",
    s3: {
      bucket: "my-bucket",
      region: "us-east-1",
      accessKeyId: "AKIA...",
      secretAccessKey: "secret...",
    },
  },
  fallbackStorage: {
    provider: "whatsapp",
    whatsapp: {
      baseUrl: "https://graph.facebook.com/v20.0",
      accessToken: "token",
      phoneNumberId: "phone-id",
    },
  },
});
```

### Backward Compatibility

Existing code continues to work:

```typescript
import { LegacyMediaManager } from "@whatssuite/media-manager";

// Old way still works
const mediaManager = new LegacyMediaManager({
  baseUrl: "https://graph.facebook.com/v20.0",
  accessToken: "your-token",
  phoneNumberId: "your-phone-id",
});
```

## 🏗️ Storage Providers

### 1. WhatsApp Storage

Uses Meta's WhatsApp Business API for media storage.

**Pros:**

- ✅ Immediate WhatsApp integration
- ✅ No additional storage costs
- ✅ Handles WhatsApp compliance

**Cons:**

- ❌ Temporary URLs (may expire)
- ❌ Dependent on Meta's API
- ❌ Limited long-term storage

**Best for:** Immediate messaging needs, WhatsApp-focused applications

### 2. Local Storage

Stores files on your local file system.

**Pros:**

- ✅ Full control over files
- ✅ No external dependencies
- ✅ Fast local access
- ✅ No storage costs

**Cons:**

- ❌ Limited scalability
- ❌ No CDN benefits
- ❌ Storage space management
- ❌ Backup considerations

**Best for:** Development, testing, small-scale applications

### 3. Amazon S3

Uses Amazon S3 for cloud storage.

**Pros:**

- ✅ Highly scalable
- ✅ Global CDN with CloudFront
- ✅ Cost-effective
- ✅ Reliable and durable

**Cons:**

- ❌ Additional costs
- ❌ AWS dependency
- ❌ Configuration complexity

**Best for:** Production applications, high-traffic scenarios

### 4. Google Cloud Storage

Uses Google Cloud Storage for cloud storage.

**Pros:**

- ✅ Google's infrastructure
- ✅ Good integration with other Google services
- ✅ Competitive pricing
- ✅ Strong consistency

**Cons:**

- ❌ Google Cloud dependency
- ❌ Learning curve for GCP
- ❌ Additional costs

**Best for:** Google Cloud users, enterprise applications

## 🔄 Fallback Strategy

The system supports automatic fallback if primary storage fails:

```typescript
const mediaManager = new MediaManager({
  storage: {
    provider: "whatsapp", // Primary: WhatsApp for immediate use
    whatsapp: {
      /* config */
    },
  },
  fallbackStorage: {
    provider: "s3", // Fallback: S3 for reliability
    s3: {
      /* config */
    },
  },
});

// If WhatsApp fails, automatically tries S3
try {
  const result = await mediaManager.upload(params);
  // Success with primary or fallback
} catch (error) {
  // Both primary and fallback failed
}
```

## 🌍 Environment Switching

Automatically switch storage based on environment:

```typescript
import { exampleEnvironmentSwitching } from "@whatssuite/media-manager/examples";

const config = exampleEnvironmentSwitching();
const mediaManager = new MediaManager({ storage: config });

// Development: Local storage
// Staging: S3
// Production: GCS
```

## 📊 Database Integration

The system tracks which storage provider was used:

```typescript
interface MediaInfo {
  id: string;
  storageProvider?: string; // "whatsapp", "local", "s3", "gcs"
  localPath?: string; // For local storage
  // ... other fields
}
```

## 🚨 Error Handling

```typescript
import { validateStorageConfig } from "@whatssuite/media-manager/config";

const config = getStorageConfig();
const errors = validateStorageConfig(config);

if (errors.length > 0) {
  console.error("Configuration errors:", errors);
  // Handle configuration issues
}
```

## 🔒 Security Considerations

- **Environment Variables**: Store sensitive credentials securely
- **IAM Roles**: Use IAM roles for S3/GCS when possible
- **Access Control**: Implement proper access controls for media
- **Validation**: Validate file types and sizes
- **Encryption**: Enable encryption for cloud storage

## 📈 Performance Tips

1. **CDN**: Use CloudFront (S3) or Cloud CDN (GCS) for better performance
2. **Caching**: Implement appropriate caching headers
3. **Compression**: Compress images and videos before upload
4. **Batch Operations**: Use batch operations for multiple files
5. **Async Processing**: Process media uploads asynchronously

## 🧪 Testing

```typescript
// Test with different storage providers
const testConfigs = [
  {
    provider: "local" as const,
    local: { uploadDir: "./test-uploads", baseUrl: "http://localhost:3001" },
  },
  {
    provider: "s3" as const,
    s3: {
      bucket: "test-bucket",
      region: "us-east-1",
      accessKeyId: "test",
      secretAccessKey: "test",
    },
  },
];

for (const config of testConfigs) {
  const mediaManager = new MediaManager({ storage: config });
  // Test upload, get, delete operations
}
```

## 🔮 Future Enhancements

- [ ] Azure Blob Storage support
- [ ] DigitalOcean Spaces support
- [ ] MinIO support
- [ ] Media transformation (resize, compress)
- [ ] Media metadata extraction
- [ ] Bulk operations
- [ ] Media versioning
- [ ] Backup and replication strategies

## 📚 Examples

See `src/examples.ts` for comprehensive usage examples.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests
5. Submit a pull request

## 📄 License

ISC License
