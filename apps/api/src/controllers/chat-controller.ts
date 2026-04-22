import { Request, Response, NextFunction } from "express";
import * as chatService from "../services/chat-service.js";
import { AppError } from "../utils/app-error.js";

export async function handleCreateChat(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.identity) throw AppError.unauthorized();
    const { title } = req.body;

    const chat = await chatService.createChat({
      ownerType: req.identity.ownerType,
      ownerId: req.identity.ownerId,
      title,
    });

    res.status(201).json(chat);
  } catch (err) {
    next(err);
  }
}

export async function handleListChats(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.identity) throw AppError.unauthorized();

    const chats = await chatService.listChats(
      req.identity.ownerType,
      req.identity.ownerId
    );
    res.json(chats);
  } catch (err) {
    next(err);
  }
}

export async function handleGetChat(
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
    const chat = await chatService.getChat(chatId);
    res.json(chat);
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteChat(
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
    await chatService.deleteChat(chatId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function handleGetTimeline(
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
    const timeline = await chatService.getChatTimeline(chatId);
    res.json(timeline);
  } catch (err) {
    next(err);
  }
}
