import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error.js";
import * as chatService from "../services/chat-service.js";
import * as documentService from "../services/document-service.js";

export async function handleUploadDocument(
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

    const { filename, mimeType, fileData } = req.body;
    const document = await documentService.uploadDocument(chatId, {
      filename,
      mimeType,
      fileData,
    });

    res.status(201).json(document);
  } catch (err) {
    next(err);
  }
}

export async function handleListDocuments(
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

    const documents = await documentService.listDocuments(chatId);
    res.json(documents);
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteDocument(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.identity) throw AppError.unauthorized();
    const chatId = String(req.params.chatId);
    const documentId = String(req.params.documentId);
    await chatService.assertChatOwnedByIdentity(
      chatId,
      req.identity.ownerType,
      req.identity.ownerId
    );

    await documentService.deleteDocument(chatId, documentId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
