import { Router } from "express";
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  startCampaign,
  pauseCampaign,
  resumeCampaign,
  getCampaignAnalytics,
  getCampaignStats,
} from "../controllers/campaign.controller";

const router = Router();

// Campaign CRUD operations
router.get("/", getCampaigns);
router.get("/stats", getCampaignStats);
router.get("/:id", getCampaign);
router.get("/:id/analytics", getCampaignAnalytics);
router.post("/", createCampaign);
router.put("/:id", updateCampaign);
router.delete("/:id", deleteCampaign);

// Campaign control operations
router.post("/:id/start", startCampaign);
router.post("/:id/pause", pauseCampaign);
router.post("/:id/resume", resumeCampaign);

export default router;
