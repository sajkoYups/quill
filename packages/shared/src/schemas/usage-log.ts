import { z } from "zod";
import { ownerTypeSchema } from "./chat.js";

export const usageLogSchema = z.object({
  id: z.string().uuid(),
  owner_type: ownerTypeSchema,
  owner_id: z.string(),
  provider: z.string(),
  model: z.string(),
  input_tokens: z.number().int().nonnegative(),
  output_tokens: z.number().int().nonnegative(),
  total_tokens: z.number().int().nonnegative(),
  request_type: z.string(),
  created_at: z.string().datetime(),
});

export type UsageLog = z.infer<typeof usageLogSchema>;
