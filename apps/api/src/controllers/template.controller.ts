import { Request, Response } from "express";
import { TemplateManager, TemplateDefinition } from "@whatssuite/template-manager";
import { z } from "zod";
import { prisma } from "@whatssuite/db";

function getTemplateManager(): TemplateManager {
  const accessToken = process.env.ACCESS_TOKEN;
  const businessId = process.env.WABA_ID;
  const apiVersion = process.env.META_API_VERSION || "v20.0";
  if (!accessToken || !businessId) {
    throw new Error("Missing WhatsApp env vars: ACCESS_TOKEN/WABA_ID");
  }
  return new TemplateManager({
    baseUrl: `https://graph.facebook.com/${apiVersion}`,
    accessToken,
    businessId,
  });
}

export async function createTemplate(req: Request, res: Response) {
  try {
    const tm = getTemplateManager();
    const defSchema = z.object({
      name: z.string().min(1),
      language: z.string().min(2),
      category: z.enum(["MARKETING", "UTILITY", "AUTHENTICATION"]),
      components: z
        .array(
          z.object({
            type: z.enum(["HEADER", "BODY", "FOOTER", "BUTTONS"]),
            format: z.enum(["TEXT", "IMAGE", "VIDEO", "DOCUMENT"]).optional(),
            text: z.string().optional(),
            example: z.any().optional(),
            buttons: z
              .array(
                z.object({
                  type: z.enum(["QUICK_REPLY", "URL", "PHONE_NUMBER", "COPY_CODE"]),
                  text: z.string().optional(),
                  url: z.string().url().optional(),
                  phone_number: z.string().optional(),
                })
              )
              .optional(),
          })
        )
        .min(1),
    });

    const body = defSchema.parse(req.body) as TemplateDefinition;
    const data = await tm.create(body);

    // Persist/Upsert into DB (basic fields)
    await prisma.template.upsert({
      where: { name: body.name },
      update: { content: data, status: "PENDING" },
      create: { name: body.name, content: data, status: "PENDING" },
    });

    res.status(201).json(data);
  } catch (error) {
    console.error("createTemplate error:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: error.errors.map((e) => e.message).join(", ") });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function listTemplates(_req: Request, res: Response) {
  try {
    const tm = getTemplateManager();
    const data = await tm.getAll();

    // Optionally refresh DB statuses
    const items = Array.isArray(data?.data) ? data.data : [];
    await Promise.all(
      items.map((t: any) =>
        prisma.template.upsert({
          where: { name: t.name },
          update: { status: t.status, content: t },
          create: { name: t.name, status: t.status, content: t },
        })
      )
    );

    res.status(200).json(data);
  } catch (error) {
    console.error("listTemplates error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getTemplateStatus(req: Request, res: Response) {
  try {
    const { name } = req.params;
    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }
    const tm = getTemplateManager();
    const status = await tm.status(name);

    if (status) {
      await prisma.template.updateMany({ where: { name }, data: { status } });
    }

    res.status(200).json({ name, status });
  } catch (error) {
    console.error("getTemplateStatus error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteTemplate(req: Request, res: Response) {
  try {
    const { name } = req.params;
    const language = (req.query.language as string) || "en_US";
    const tm = getTemplateManager();
    const data = await tm.delete(name, language);

    // Soft-remove or clear from DB
    await prisma.template.deleteMany({ where: { name } });

    res.status(200).json(data);
  } catch (error) {
    console.error("deleteTemplate error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
