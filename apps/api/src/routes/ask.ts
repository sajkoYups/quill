import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { handleAsk } from "../controllers/ask-controller.js";

const askBodySchema = z.object({
  message: z.string().min(1),
  screenshot: z.string().optional(),
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

router.post("/chats/:chatId/ask", validate(askBodySchema), handleAsk);

export default router;
