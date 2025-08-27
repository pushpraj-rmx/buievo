import { Request, Response, NextFunction } from "express";
import { createContactSchema, updateContactSchema } from "@whatssuite/validation";

export const validateContact = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Convert empty email string to null
    if (req.body.email === "") {
      req.body.email = null;
    }

    const validatedData = createContactSchema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error: any) {
    if (error.errors) {
      const errorMessages = error.errors.map((err: any) => err.message).join(", ");
      return res.status(400).json({ message: errorMessages });
    }
    return res.status(400).json({ message: "Validation failed" });
  }
};

export const validateUpdateContact = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Convert empty email string to null
    if (req.body.email === "") {
      req.body.email = null;
    }

    const validatedData = updateContactSchema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error: any) {
    if (error.errors) {
      const errorMessages = error.errors.map((err: any) => err.message).join(", ");
      return res.status(400).json({ message: errorMessages });
    }
    return res.status(400).json({ message: "Validation failed" });
  }
};
