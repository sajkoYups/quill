import { supabase, isSupabaseConfigured } from "../db/supabase.js";
import { AppError } from "../utils/app-error.js";

const GUEST_TOKEN_LIMIT = getEnvInt("GUEST_TOKEN_LIMIT", 50000);
const FREE_USER_TOKEN_LIMIT = getEnvInt("FREE_USER_TOKEN_LIMIT", 200000);
const PAID_USER_TOKEN_LIMIT = getEnvInt("PAID_USER_TOKEN_LIMIT", 2000000);
const WARNING_THRESHOLD = 0.8;
const PAID_PLAN_NAMES = new Set(["plus", "pro"]);
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due"]);

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
  const tier = await getTier(ownerType, ownerId);

  if (!isSupabaseConfigured()) {
    const fallbackLimit =
      tier === "paid"
        ? PAID_USER_TOKEN_LIMIT
        : tier === "free"
          ? FREE_USER_TOKEN_LIMIT
          : GUEST_TOKEN_LIMIT;
    return {
      totalTokens: 0,
      limit: fallbackLimit,
      remaining: fallbackLimit,
      warning: false,
      tier,
    };
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

  const limit =
    tier === "paid"
      ? PAID_USER_TOKEN_LIMIT
      : tier === "free"
        ? FREE_USER_TOKEN_LIMIT
        : GUEST_TOKEN_LIMIT;
  const remaining = Math.max(0, limit - totalTokens);
  const warning = totalTokens >= limit * WARNING_THRESHOLD;

  return { totalTokens, limit, remaining, warning, tier };
}

export async function checkLimit(ownerType: string, ownerId: string) {
  const usage = await getUsage(ownerType, ownerId);
  return {
    allowed: usage.remaining > 0,
    ...usage,
  };
}

async function getTier(
  ownerType: string,
  ownerId: string
): Promise<"guest" | "free" | "paid"> {
  if (ownerType === "guest") return "guest";
  if (!isSupabaseConfigured()) return "free";

  const { data } = await supabase
    .from("subscriptions")
    .select("status, plan_name, current_period_end")
    .eq("user_id", ownerId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const status = String(data?.status || "").toLowerCase();
  const planName = String(data?.plan_name || "").toLowerCase();
  const periodEnd = data?.current_period_end
    ? new Date(String(data.current_period_end))
    : null;
  const periodValid = periodEnd ? periodEnd.getTime() > Date.now() : true;

  if (
    ACTIVE_SUBSCRIPTION_STATUSES.has(status) &&
    PAID_PLAN_NAMES.has(planName) &&
    periodValid
  ) {
    return "paid";
  }

  return "free";
}

function getEnvInt(key: string, fallback: number): number {
  const value = Number.parseInt(process.env[key] || "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
