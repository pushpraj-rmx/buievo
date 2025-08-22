import { Router } from "express";
import {
  createTemplate,
  listTemplates,
  getTemplateStatus,
  deleteTemplate,
} from "../controllers/template.controller";
import { prisma } from "@whatssuite/db";

const router = Router();

router.post("/", createTemplate);
router.get("/", listTemplates);
router.get("/db", async (req, res) => {
  const take = Math.min(
    parseInt(String(req.query.take ?? "50"), 10) || 50,
    200,
  );
  const skip = parseInt(String(req.query.skip ?? "0"), 10) || 0;
  const items = await prisma.template.findMany({
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });
  res.json(items);
});
router.get("/:name/db", async (req, res) => {
  const name = req.params.name;
  if (!name) return res.status(400).json({ message: "name is required" });
  const item = await prisma.template.findUnique({ where: { name } });
  if (!item) return res.status(404).json({ message: "Not found" });
  res.json(item);
});
router.get("/:name/status", getTemplateStatus);
router.delete("/:name", deleteTemplate);

export default router;
