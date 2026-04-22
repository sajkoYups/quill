import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error.js";
import * as chatService from "../services/chat-service.js";
import * as screenshotService from "../services/screenshot-service.js";

export async function handleUploadScreenshot(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.identity) throw AppError.unauthorized();
    const chatId = String(req.params.chatId);
    await chatService.assertChatOwnedByIdentity(
      chatId,
      req.identity.ownerType,
      req.identity.ownerId
    );
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
