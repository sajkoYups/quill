import { Request, Response, NextFunction } from "express";
import * as usageService from "../services/usage-service.js";
import { AppError } from "../utils/app-error.js";

export async function handleGetUsage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.identity) throw AppError.unauthorized();
    const usage = await usageService.getUsage(
      req.identity.ownerType,
      req.identity.ownerId
    );
    res.json(usage);
  } catch (err) {
    next(err);
  }
}
