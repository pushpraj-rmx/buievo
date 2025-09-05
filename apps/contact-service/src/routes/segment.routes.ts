import { Router, type IRouter } from "express";
import { SegmentController } from "../controllers/segment.controller";

const router: IRouter = Router();

// Get all segments
router.get("/", SegmentController.getSegments);

// Specific routes must come before parameterized routes
router.get("/stats", SegmentController.getSegmentStats);

// Get single segment by ID
router.get("/:id", SegmentController.getSegment);

// Create new segment
router.post("/", SegmentController.createSegment);

// Update segment
router.put("/:id", SegmentController.updateSegment);

// Delete segment
router.delete("/:id", SegmentController.deleteSegment);

// Add contacts to segment
router.post("/:id/contacts", SegmentController.addContactsToSegment);

// Remove contacts from segment
router.delete("/:id/contacts", SegmentController.removeContactsFromSegment);

export { router as segmentRoutes };
