import { Request, Response } from "express";
import { MediaManager, MediaType } from "@buievo/media-manager";
import { z } from "zod";
import { prisma } from "@buievo/db";

function getMediaManager(): MediaManager {
  const accessToken = process.env.ACCESS_TOKEN;
  const phoneNumberId = process.env.PHONE_NUMBER_ID;
  const apiVersion = process.env.META_API_VERSION || "v21.0";
  if (!accessToken || !phoneNumberId) {
    throw new Error("Missing WhatsApp env vars: ACCESS_TOKEN/PHONE_NUMBER_ID");
  }
  return new MediaManager({
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

const uploadSchema = z.object({
  type: z.enum(["image", "video", "audio", "document"]).default("document"),
});

export async function uploadMedia(req: Request, res: Response) {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    const { type } = uploadSchema.parse({ type: req.query.type });

    if (!file) {
      return res
        .status(400)
        .json({ message: "file is required (multipart/form-data)" });
    }

    // WhatsApp media size limits (in bytes)
    const WHATSAPP_MEDIA_LIMITS = {
      image: 5 * 1024 * 1024, // 5MB
      video: 16 * 1024 * 1024, // 16MB
      audio: 16 * 1024 * 1024, // 16MB
      document: 100 * 1024 * 1024, // 100MB
    };

    // Validate file size
    const maxSize =
      WHATSAPP_MEDIA_LIMITS[type as keyof typeof WHATSAPP_MEDIA_LIMITS];
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return res.status(400).json({
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} files cannot exceed ${maxSizeMB}MB. Your file is ${fileSizeMB}MB.`,
      });
    }

    const mediaManager = getMediaManager();
    const result = await mediaManager.upload({
      type: type as MediaType,
      fileName: file.originalname,
      mimeType: file.mimetype,
      data: file.buffer,
    });

    // persist in DB
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

    res.status(201).json({ ...result, recordId: saved.id });
  } catch (error) {
    console.error("uploadMedia error:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: error.errors.map((e) => e.message).join(", ") });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMediaInfo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    // Look up by DB id first; if not found assume it's a WA media id
    const asset = await prisma.mediaAsset.findFirst({
      where: { OR: [{ id }, { waMediaId: id }] },
    });
    const mediaId = asset?.waMediaId ?? id;

    const mediaManager = getMediaManager();
    const result = await mediaManager.get(mediaId);

    // Update stored fields opportunistically
    if (asset) {
      await prisma.mediaAsset.update({
        where: { id: asset.id },
        data: { url: result.url, sha256: result.sha256 },
      });
    }

    res.status(200).json({ db: asset, remote: result });
  } catch (error) {
    console.error("getMediaInfo error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteMedia(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const asset = await prisma.mediaAsset.findFirst({
      where: { OR: [{ id }, { waMediaId: id }] },
    });
    const mediaId = asset?.waMediaId ?? id;

    const mediaManager = getMediaManager();
    const result = await mediaManager.delete(mediaId);

    if (asset) {
      await prisma.mediaAsset.delete({ where: { id: asset.id } });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("deleteMedia error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
