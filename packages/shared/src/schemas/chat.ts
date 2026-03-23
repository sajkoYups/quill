import { z } from "zod";

export const ownerTypeSchema = z.enum(["user", "guest"]);

export const chatSchema = z.object({
  id: z.string().uuid(),
  owner_type: ownerTypeSchema,
  owner_id: z.string(),
  title: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createChatSchema = z.object({
  title: z.string().optional(),
});

export type OwnerType = z.infer<typeof ownerTypeSchema>;
export type Chat = z.infer<typeof chatSchema>;
export type CreateChatInput = z.infer<typeof createChatSchema>;
