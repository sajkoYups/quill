import { Request, Response, NextFunction } from "express";
import * as guestService from "../services/guest-service.js";
import { isSupabaseConfigured } from "../db/supabase.js";
import { AppError } from "../utils/app-error.js";

export async function handleGuestInit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { deviceId } = req.body;
    if (!deviceId) throw AppError.badRequest("deviceId is required");

    if (!isSupabaseConfigured()) {
      res.json({ deviceId, status: "ok", persisted: false });
      return;
    }

    const guest = await guestService.initGuest(deviceId);
    res.json({ deviceId: guest.device_id, id: guest.id, status: "ok", persisted: true });
  } catch (err) {
    next(err);
  }
}

export async function handleGetMe(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.identity) throw AppError.unauthorized();
    res.json(req.identity);
  } catch (err) {
    next(err);
  }
}
