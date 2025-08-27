import { Router } from "express";
import { 
  subscribeAppToWABA, 
  getSubscribedApps, 
  unsubscribeAppFromWABA 
} from "../controllers/waba.controller";

const router = Router();

// WABA Subscription Management Routes
router.post("/subscribe", subscribeAppToWABA);
router.get("/:wabaId/subscribed-apps", getSubscribedApps);
router.delete("/:wabaId/unsubscribe", unsubscribeAppFromWABA);

export default router;
