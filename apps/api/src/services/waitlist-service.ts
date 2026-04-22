import { isSupabaseConfigured, supabase } from "../db/supabase.js";
import { AppError } from "../utils/app-error.js";
import { verifyRecaptchaToken } from "./recaptcha-service.js";

export interface WaitlistSignupInput {
  email: string;
  name?: string;
  source?: string;
  platform?: string;
  recaptchaToken: string;
  clientIp?: string;
}

export interface WaitlistSignupResult {
  status: "ok";
  email: string;
  product: "quill";
  stage: "waitlist";
}

function normalizeInput(input: WaitlistSignupInput): WaitlistSignupInput {
  return {
    email: input.email.trim().toLowerCase(),
    name: input.name?.trim() || undefined,
    source: input.source?.trim() || "landing-page",
    platform: input.platform?.trim() || undefined,
    recaptchaToken: input.recaptchaToken.trim(),
    clientIp: input.clientIp,
  };
}

export async function signupWaitlist(
  rawInput: WaitlistSignupInput
): Promise<WaitlistSignupResult> {
  if (!isSupabaseConfigured()) {
    throw new AppError(
      500,
      "Supabase is not configured",
      undefined,
      "supabase_not_configured"
    );
  }

  const input = normalizeInput(rawInput);
  await verifyRecaptchaToken(input.recaptchaToken, "waitlist_submit", input.clientIp);

  const { error } = await supabase.from("waitlist").upsert(
    {
      email: input.email,
      name: input.name || null,
      product: "quill",
      stage: "waitlist",
      source: input.source || "landing-page",
      platform: input.platform || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" }
  );

  if (error) {
    throw new AppError(
      500,
      "Failed to save waitlist signup",
      error.message,
      "supabase_upsert_failed"
    );
  }

  return {
    status: "ok",
    email: input.email,
    product: "quill",
    stage: "waitlist",
  };
}
