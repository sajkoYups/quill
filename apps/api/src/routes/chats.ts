import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import {
  handleCreateChat,
  handleListChats,
  handleGetChat,
  handleDeleteChat,
  handleGetTimeline,
} from "../controllers/chat-controller.js";
import { handleUploadScreenshot } from "../controllers/screenshot-controller.js";

const createChatSchema = z.object({
  title: z.string().optional(),
});

const uploadScreenshotSchema = z.object({
  screenshot: z.string().min(1),
  monitorLabel: z.string().optional(),
});

const router = Router();

router.get("/chats", handleListChats);
router.post("/chats", validate(createChatSchema), handleCreateChat);
router.get("/chats/:chatId", handleGetChat);
router.delete("/chats/:chatId", handleDeleteChat);
router.get("/chats/:chatId/timeline", handleGetTimeline);
router.post(
  "/chats/:chatId/screenshots",
  validate(uploadScreenshotSchema),
  handleUploadScreenshot
);

export default router;
