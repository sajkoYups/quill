import { z } from "zod";

export const screenshotSchema = z.object({
  id: z.string().uuid(),
  chat_id: z.string().uuid(),
  message_id: z.string().uuid().nullable(),
  storage_path: z.string(),
  public_or_signed_url: z.string().url().nullable(),
  monitor_label: z.string().nullable(),
  created_at: z.string().datetime(),
});

export type Screenshot = z.infer<typeof screenshotSchema>;
