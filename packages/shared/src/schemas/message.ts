import { z } from "zod";

export const messageRoleSchema = z.enum(["user", "assistant", "system"]);

export const messageSchema = z.object({
  id: z.string().uuid(),
  chat_id: z.string().uuid(),
  role: messageRoleSchema,
  content: z.string(),
  created_at: z.string().datetime(),
});

export const createMessageSchema = z.object({
  content: z.string().min(1),
});

export type MessageRole = z.infer<typeof messageRoleSchema>;
export type Message = z.infer<typeof messageSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
