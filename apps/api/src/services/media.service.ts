import { MediaManager, MediaType } from "@whatssuite/media-manager";
import { prisma } from "@whatssuite/db";
import type { 
  MediaUploadResponse,
  UploadMediaRequest
} from "@whatssuite/types";

export class MediaService {
  private mediaManager: MediaManager;

  constructor() {
    const accessToken = process.env.ACCESS_TOKEN;
    const phoneNumberId = process.env.PHONE_NUMBER_ID;
    const apiVersion = process.env.META_API_VERSION || "v21.0";
    
    if (!accessToken || !phoneNumberId) {
      throw new Error("Missing WhatsApp env vars: ACCESS_TOKEN/PHONE_NUMBER_ID");
    }
    
    this.mediaManager = new MediaManager({
      storage: {
        provider: "whatsapp",
        whatsapp: {
          baseUrl: `https://graph.facebook.com/${apiVersion}`,
          accessToken,
          phoneNumberId,
        },
      },
    });
  }

  /**
   * Upload media file
   */
  async uploadMedia(
    file: any, // Express.Multer.File
    type: MediaType = "document"
  ): Promise<MediaUploadResponse> {
    // WhatsApp media size limits (in bytes)
    const WHATSAPP_MEDIA_LIMITS = {
      image: 5 * 1024 * 1024, // 5MB
      video: 16 * 1024 * 1024, // 16MB
      audio: 16 * 1024 * 1024, // 16MB
      document: 100 * 1024 * 1024, // 100MB
    };

    // Validate file size
    const maxSize = WHATSAPP_MEDIA_LIMITS[type];
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      throw new Error(
        `${type.charAt(0).toUpperCase() + type.slice(1)} files cannot exceed ${maxSizeMB}MB. Your file is ${fileSizeMB}MB.`
      );
    }

    // Upload to WhatsApp
    const result = await this.mediaManager.upload({
      type,
      fileName: file.originalname,
      mimeType: file.mimetype,
      data: file.buffer,
    });

    // Save to database
    const saved = await prisma.mediaAsset.create({
      data: {
        waMediaId: result.id,
        type,
        mimeType: file.mimetype,
        fileName: file.originalname,
        size: file.size,
        sha256: result.sha256,
        url: result.url,
        status: result.status ?? "UPLOADED",
      },
    });

    return {
      id: result.id,
      url: result.url || '',
      type,
      size: file.size,
      mimeType: file.mimetype,
      recordId: saved.id,
    };
  }

  /**
   * Get media information
   */
  async getMediaInfo(id: string): Promise<{
    db: any;
    remote: any;
  }> {
    // Look up by DB id first; if not found assume it's a WA media id
    const asset = await prisma.mediaAsset.findFirst({
      where: { OR: [{ id }, { waMediaId: id }] },
    });
    
    const mediaId = asset?.waMediaId ?? id;

    // Get from WhatsApp
    const result = await this.mediaManager.get(mediaId);

    // Update stored fields opportunistically
    if (asset) {
      await prisma.mediaAsset.update({
        where: { id: asset.id },
        data: {
          url: result.url,
          status: result.status,
        },
      });
    }

    return {
      db: asset,
      remote: result,
    };
  }

  /**
   * Delete media
   */
  async deleteMedia(id: string): Promise<boolean> {
    try {
      // Look up by DB id first; if not found assume it's a WA media id
      const asset = await prisma.mediaAsset.findFirst({
        where: { OR: [{ id }, { waMediaId: id }] },
      });
      
      const mediaId = asset?.waMediaId ?? id;

      // Delete from WhatsApp
      await this.mediaManager.delete(mediaId);

      // Delete from database if we have a record
      if (asset) {
        await prisma.mediaAsset.delete({
          where: { id: asset.id },
        });
      }

      return true;
    } catch (error) {
      console.error("Error deleting media:", error);
      return false;
    }
  }

  /**
   * Get media assets with pagination
   */
  async getMediaAssets(
    page: number = 1,
    limit: number = 20,
    type?: string
  ): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const skip = (page - 1) * limit;
    
    // Build where clause based on filters
    const where: any = {};
    
    if (type) {
      where.type = type;
    }

    // Get media assets
    const assets = await prisma.mediaAsset.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get total count for pagination
    const total = await prisma.mediaAsset.count({ where });

    return {
      data: assets as any,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get media asset by ID
   */
  async getMediaAssetById(id: string): Promise<{ asset: any }> {
    const asset = await prisma.mediaAsset.findUnique({
      where: { id },
    });

    return { asset };
  }

  /**
   * Update media asset
   */
  async updateMediaAsset(
    id: string,
    data: {
      fileName?: string;
      status?: string;
    }
  ): Promise<{ asset: any }> {
    const asset = await prisma.mediaAsset.update({
      where: { id },
      data,
    });

    return { asset };
  }

  /**
   * Get media statistics
   */
  async getMediaStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const [total, byType, byStatus] = await Promise.all([
      prisma.mediaAsset.count(),
      prisma.mediaAsset.groupBy({
        by: ['type'],
        _count: {
          id: true,
        },
      }),
      prisma.mediaAsset.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
      }),
    ]);

    const typeStats: Record<string, number> = {};
    byType.forEach((item) => {
      typeStats[item.type] = item._count.id;
    });

    const statusStats: Record<string, number> = {};
    byStatus.forEach((item) => {
      statusStats[item.status] = item._count.id;
    });

    return {
      total,
      byType: typeStats,
      byStatus: statusStats,
    };
  }

  /**
   * Search media assets
   */
  async searchMediaAssets(
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const skip = (page - 1) * limit;

    const assets = await prisma.mediaAsset.findMany({
      where: {
        OR: [
          { fileName: { contains: query, mode: 'insensitive' } },
          { type: { contains: query, mode: 'insensitive' } },
          { mimeType: { contains: query, mode: 'insensitive' } },
        ],
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.mediaAsset.count({
      where: {
        OR: [
          { fileName: { contains: query, mode: 'insensitive' } },
          { type: { contains: query, mode: 'insensitive' } },
          { mimeType: { contains: query, mode: 'insensitive' } },
        ],
      },
    });

    return {
      data: assets as any,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get media assets by type
   */
  async getMediaAssetsByType(
    type: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const skip = (page - 1) * limit;

    const assets = await prisma.mediaAsset.findMany({
      where: { type },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.mediaAsset.count({
      where: { type },
    });

    return {
      data: assets as any,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Validate media file
   */
  async validateMediaFile(
    file: any,
    type: MediaType
  ): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check file size
    const WHATSAPP_MEDIA_LIMITS = {
      image: 5 * 1024 * 1024, // 5MB
      video: 16 * 1024 * 1024, // 16MB
      audio: 16 * 1024 * 1024, // 16MB
      document: 100 * 1024 * 1024, // 100MB
    };

    const maxSize = WHATSAPP_MEDIA_LIMITS[type];
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      errors.push(
        `${type.charAt(0).toUpperCase() + type.slice(1)} files cannot exceed ${maxSizeMB}MB. Your file is ${fileSizeMB}MB.`
      );
    }

    // Check MIME type
    const validMimeTypes = {
      image: ['image/jpeg', 'image/png', 'image/webp'],
      video: ['video/mp4', 'video/3gpp'],
      audio: ['audio/aac', 'audio/mp4', 'audio/mpeg', 'audio/amr', 'audio/ogg'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    };

    const allowedMimeTypes = validMimeTypes[type];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`Invalid MIME type for ${type}. Allowed: ${allowedMimeTypes.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const mediaService = new MediaService();
