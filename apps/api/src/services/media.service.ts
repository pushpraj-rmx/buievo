import { MediaManager, MediaType } from "@whatssuite/media-manager";
import { prisma } from "@whatssuite/db";

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
    file: Express.Multer.File,
    type: MediaType = "document"
  ): Promise<any> {
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
      ...result,
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
        data: { url: result.url, sha256: result.sha256 },
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
  async deleteMedia(id: string): Promise<any> {
    const asset = await prisma.mediaAsset.findFirst({
      where: { OR: [{ id }, { waMediaId: id }] },
    });
    
    const mediaId = asset?.waMediaId ?? id;

    // Delete from WhatsApp
    const result = await this.mediaManager.delete(mediaId);

    // Delete from database
    if (asset) {
      await prisma.mediaAsset.delete({ where: { id: asset.id } });
    }

    return result;
  }

  /**
   * Get all media assets
   */
  async getAllMedia(
    page: number = 1,
    limit: number = 20,
    type?: string
  ): Promise<{
    media: any[];
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
    
    const where: any = {};
    if (type) {
      where.type = type;
    }

    const media = await prisma.mediaAsset.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.mediaAsset.count({ where });

    return {
      media,
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
   * Get media statistics
   */
  async getMediaStats(): Promise<{
    total: number;
    images: number;
    videos: number;
    audio: number;
    documents: number;
    totalSize: number;
  }> {
    const stats = await prisma.mediaAsset.groupBy({
      by: ['type'],
      _count: {
        id: true,
      },
      _sum: {
        size: true,
      },
    });

    const typeStats: Record<string, { count: number; size: number }> = {};
    let totalSize = 0;

    stats.forEach((stat) => {
      const count = stat._count.id;
      const size = stat._sum.size || 0;
      typeStats[stat.type] = { count, size };
      totalSize += size;
    });

    return {
      total: Object.values(typeStats).reduce((sum, stat) => sum + stat.count, 0),
      images: typeStats['image']?.count || 0,
      videos: typeStats['video']?.count || 0,
      audio: typeStats['audio']?.count || 0,
      documents: typeStats['document']?.count || 0,
      totalSize,
    };
  }

  /**
   * Search media by filename
   */
  async searchMedia(query: string): Promise<any[]> {
    const media = await prisma.mediaAsset.findMany({
      where: {
        fileName: {
          contains: query,
          mode: 'insensitive',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return media;
  }

  /**
   * Get media by type
   */
  async getMediaByType(type: string): Promise<any[]> {
    const media = await prisma.mediaAsset.findMany({
      where: { type },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return media;
  }

  /**
   * Update media status
   */
  async updateMediaStatus(id: string, status: string): Promise<any> {
    const media = await prisma.mediaAsset.update({
      where: { id },
      data: { status },
    });

    return media;
  }

  /**
   * Validate file type
   */
  validateFileType(mimetype: string, type: MediaType): boolean {
    const allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/3gpp', 'video/avi', 'video/mov'],
      audio: ['audio/mp3', 'audio/ogg', 'audio/wav', 'audio/aac'],
      document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
      ],
    };

    return allowedTypes[type].includes(mimetype);
  }

  /**
   * Get file extension from mimetype
   */
  getFileExtension(mimetype: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/3gpp': '.3gp',
      'video/avi': '.avi',
      'video/mov': '.mov',
      'audio/mp3': '.mp3',
      'audio/ogg': '.ogg',
      'audio/wav': '.wav',
      'audio/aac': '.aac',
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'text/plain': '.txt',
    };

    return extensions[mimetype] || '';
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Export singleton instance
export const mediaService = new MediaService();
