import { Request, Response, NextFunction } from "express";
import { askWithScreenshot } from "../services/ai-service.js";
import { isSupabaseConfigured } from "../db/supabase.js";
import * as messageService from "../services/message-service.js";
import * as screenshotService from "../services/screenshot-service.js";
import * as usageService from "../services/usage-service.js";
import * as chatService from "../services/chat-service.js";
import * as documentService from "../services/document-service.js";
import { AppError } from "../utils/app-error.js";
import type { ChatMessage } from "../providers/index.js";
import { createProvider } from "../providers/index.js";

export async function handleAsk(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const chatId = String(req.params.chatId);
  try {
    if (!req.identity) throw AppError.unauthorized();
    const { message, screenshot, history, documentIds } = req.body;

    await chatService.assertChatOwnedByIdentity(
      chatId,
      req.identity.ownerType,
      req.identity.ownerId
    );

    if (isSupabaseConfigured()) {
      const limit = await usageService.checkLimit(
        req.identity.ownerType,
        req.identity.ownerId
      );
      if (!limit.allowed) {
        throw AppError.tooManyRequests(
          "Usage limit reached. Please upgrade your plan or wait until next month."
        );
      }
    }

    let screenshotForAI = screenshot;

    if (isSupabaseConfigured()) {
      await messageService.appendMessage(chatId, "user", message);

      if (!screenshot) {
        const latest = await screenshotService.getLatestScreenshot(chatId);
        if (latest?.public_or_signed_url) {
          screenshotForAI = latest.public_or_signed_url;
        }
      }
    }

    const messages: ChatMessage[] = [
      ...(history || []),
      { role: "user" as const, content: message },
    ];

    const { context: documentContext } =
      isSupabaseConfigured() && req.identity
        ? await documentService.getRelevantDocumentContext(
            chatId,
            message,
            documentIds
          )
        : { context: "" };

    const result = await askWithScreenshot(
      messages,
      screenshotForAI,
      documentContext
    );

    if (isSupabaseConfigured()) {
      await messageService.appendMessage(chatId, "assistant", result.content);

      if (result.usage) {
        const provider = createProvider();
        await usageService.logUsage({
          ownerType: req.identity.ownerType,
          ownerId: req.identity.ownerId,
          provider: provider.name,
          model: "mistralai/mistral-small-2603",
          // model: "gpt-4o",
          inputTokens: result.usage.input_tokens,
          outputTokens: result.usage.output_tokens,
          totalTokens: result.usage.total_tokens,
        });
      }
    }

    res.json({
      response: result.content,
      usage: result.usage,
    });
  } catch (err) {
    if (err instanceof AppError && err.code === "CONTENT_FILTER_BLOCKED") {
      console.warn("[content-filter] blocked request", {
        chatId,
        code: err.code,
      });
    }
    next(err);
  }
}
