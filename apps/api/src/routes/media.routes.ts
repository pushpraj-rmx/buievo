import { Router } from "express";
import { prisma } from "@whatssuite/db";
import multer from "multer";
import {
  uploadMedia,
  getMediaInfo,
  deleteMedia,
} from "../controllers/media.controller";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file"), uploadMedia);
router.get("/", async (req, res) => {
  const take = Math.min(parseInt(String(req.query.take ?? "50"), 10) || 50, 100);
  const skip = parseInt(String(req.query.skip ?? "0"), 10) || 0;
  const items = await prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take, skip });
  res.json(items);
});
router.get("/:id", getMediaInfo);
router.delete("/:id", deleteMedia);

export default router;
