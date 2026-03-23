import { supabase, isSupabaseConfigured } from "../db/supabase.js";
import { AppError } from "../utils/app-error.js";

const GUEST_TOKEN_LIMIT = parseInt(process.env.GUEST_TOKEN_LIMIT || "10000", 10);
const FREE_USER_TOKEN_LIMIT = parseInt(process.env.FREE_USER_TOKEN_LIMIT || "50000", 10);
const PAID_USER_TOKEN_LIMIT = parseInt(process.env.PAID_USER_TOKEN_LIMIT || "500000", 10);
const WARNING_THRESHOLD = 0.8;

export interface UsageLogParams {
  ownerType: "user" | "guest";
  ownerId: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requestType?: string;
}

export async function logUsage(params: UsageLogParams) {
  if (!isSupabaseConfigured()) return;

  const { error } = await supabase.from("usage_logs").insert({
    owner_type: params.ownerType,
    owner_id: params.ownerId,
    provider: params.provider,
    model: params.model,
    input_tokens: params.inputTokens,
    output_tokens: params.outputTokens,
    total_tokens: params.totalTokens,
    request_type: params.requestType || "chat",
  });

  if (error) console.error("[usage] Failed to log usage:", error.message);
}

export async function getUsage(ownerType: string, ownerId: string) {
  if (!isSupabaseConfigured()) {
    return { totalTokens: 0, limit: GUEST_TOKEN_LIMIT, remaining: GUEST_TOKEN_LIMIT, warning: false };
  }

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data, error } = await supabase
    .from("usage_logs")
    .select("total_tokens")
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .gte("created_at", periodStart);

  if (error) throw AppError.internal(`Failed to get usage: ${error.message}`);

  const totalTokens = (data || []).reduce(
    (sum: number, row: any) => sum + (row.total_tokens || 0),
    0
  );

  const limit = await getLimit(ownerType, ownerId);
  const remaining = Math.max(0, limit - totalTokens);
  const warning = totalTokens >= limit * WARNING_THRESHOLD;

  return { totalTokens, limit, remaining, warning };
}

export async function checkLimit(ownerType: string, ownerId: string) {
  const usage = await getUsage(ownerType, ownerId);
  return {
    allowed: usage.remaining > 0,
    ...usage,
  };
}

async function getLimit(ownerType: string, ownerId: string): Promise<number> {
  if (ownerType === "guest") return GUEST_TOKEN_LIMIT;

  if (!isSupabaseConfigured()) return FREE_USER_TOKEN_LIMIT;

  const { data } = await supabase
    .from("subscriptions")
    .select("status, plan_name")
    .eq("user_id", ownerId)
    .eq("status", "active")
    .single();

  if (data?.plan_name && data.plan_name !== "free") {
    return PAID_USER_TOKEN_LIMIT;
  }

  return FREE_USER_TOKEN_LIMIT;
}
