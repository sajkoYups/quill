import { Request, Response, NextFunction } from "express";
import * as screenshotService from "../services/screenshot-service.js";

export async function handleUploadScreenshot(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const chatId = String(req.params.chatId);
    const { screenshot, monitorLabel } = req.body;

    const result = await screenshotService.uploadScreenshot(
      chatId,
      screenshot,
      monitorLabel
    );

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
