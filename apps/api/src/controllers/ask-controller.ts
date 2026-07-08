import { Request, Response, NextFunction } from "express";
import { askWithScreenshot } from "../services/ai-service.js";
import * as usageService from "../services/usage-service.js";
import { AppError } from "../utils/app-error.js";
import type { ChatMessage } from "../providers/index.js";
import { createProvider } from "../providers/index.js";
import { MAX_DOCUMENT_CONTEXT_CHARS } from "@quill/document-processing";

export async function handleAsk(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.identity) throw AppError.unauthorized();
    const { message, screenshot, history, documentContext } = req.body;

    const limit = await usageService.checkLimit(
      req.identity.ownerType,
      req.identity.ownerId
    );
    if (!limit.allowed) {
      throw AppError.tooManyRequests(
        "Usage limit reached. Please upgrade your plan or wait until next month."
      );
    }

    const messages: ChatMessage[] = [
      ...(history || []),
      { role: "user" as const, content: message },
    ];

    const trimmedContext =
      typeof documentContext === "string"
        ? documentContext.slice(0, MAX_DOCUMENT_CONTEXT_CHARS)
        : "";

    const result = await askWithScreenshot(messages, screenshot, trimmedContext);

    if (result.usage) {
      const provider = createProvider();
      await usageService.logUsage({
        ownerType: req.identity.ownerType,
        ownerId: req.identity.ownerId,
        provider: provider.name,
        model: provider.model,
        inputTokens: result.usage.input_tokens,
        outputTokens: result.usage.output_tokens,
        totalTokens: result.usage.total_tokens,
      });
    }

    res.json({
      response: result.content,
      usage: result.usage,
    });
  } catch (err) {
    if (err instanceof AppError && err.code === "CONTENT_FILTER_BLOCKED") {
      console.warn("[content-filter] blocked request");
    }
    next(err);
  }
}
