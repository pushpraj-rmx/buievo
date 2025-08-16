import { Router } from "express";
import { prisma } from "@whatssuite/db";
import multer from "multer";
import {
  uploadMedia,
  getMediaInfo,
  deleteMedia,
} from "../controllers/media.controller";
import axios from "axios";
import { MediaManager } from "@whatssuite/media-manager";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file"), uploadMedia);
router.get("/", async (req, res) => {
  const take = Math.min(
    parseInt(String(req.query.take ?? "50"), 10) || 50,
    100,
  );
  const skip = parseInt(String(req.query.skip ?? "0"), 10) || 0;
  const items = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });
  res.json(items);
});
// Stream media content via server (adds Authorization header)
router.get("/:id/file", async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await prisma.mediaAsset.findFirst({
      where: { OR: [{ id }, { waMediaId: id }] },
    });
    const mediaId = asset?.waMediaId ?? id;

    const accessToken = process.env.ACCESS_TOKEN;
    const phoneNumberId = process.env.PHONE_NUMBER_ID;
    const apiVersion = process.env.META_API_VERSION || "v20.0";
    if (!accessToken || !phoneNumberId) {
      return res.status(500).json({ message: "Missing WhatsApp env vars" });
    }

    const mm = new MediaManager({
      storage: {
        provider: "whatsapp",
        whatsapp: {
          baseUrl: `https://graph.facebook.com/${apiVersion}`,
          accessToken,
          phoneNumberId,
        }
      }
    });
    const info = await mm.get(mediaId);
    if (!info.url) {
      return res.status(404).json({ message: "Media URL not available yet" });
    }

    const upstream = await axios.get(info.url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      responseType: "stream",
    });
    const contentType =
      upstream.headers["content-type"] ||
      info.mimeType ||
      "application/octet-stream";
    res.setHeader("Content-Type", contentType as string);
    res.setHeader("Cache-Control", "private, max-age=60");
    upstream.data.pipe(res);
  } catch (err) {
    console.error("media file proxy error", err);
    res.status(500).json({ message: "Failed to fetch media" });
  }
});
router.get("/:id", getMediaInfo);
router.delete("/:id", deleteMedia);

export default router;
