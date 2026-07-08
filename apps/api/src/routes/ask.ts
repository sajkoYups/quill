import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { handleAsk } from "../controllers/ask-controller.js";

const askBodySchema = z.object({
  message: z.string().min(1),
  screenshot: z.string().optional(),
  documentContext: z.string().optional().default(""),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

const router = Router();

router.post("/ask", validate(askBodySchema), handleAsk);
// Backward-compatible alias for older desktop builds that still target the
// per-chat path. The handler is stateless and ignores the chatId param.
router.post("/chats/:chatId/ask", validate(askBodySchema), handleAsk);

export default router;
