import Stripe from "stripe";
import { supabase, isSupabaseConfigured } from "../db/supabase.js";
import { AppError } from "../utils/app-error.js";

let stripe: Stripe | null = null;
const PAID_PLAN_NAME = "plus";
const WEBHOOK_EVENT_TTL_MS = 1000 * 60 * 60;
const processedWebhookEvents = new Map<string, number>();

function getStripe(): Stripe {
  if (stripe) return stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw AppError.internal("STRIPE_SECRET_KEY not configured");
  stripe = new Stripe(key);
  return stripe;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Ensures a row exists in public.users for this auth user id so subscriptions.user_id FK succeeds.
 */
export async function ensurePublicUserRecord(userId: string, email: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const safeEmail =
    email?.trim() || `${userId}@billing.placeholder.local`;
  const { error } = await supabase.from("users").upsert(
    {
      id: userId,
      email: safeEmail,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (error) {
    console.error("[billing] ensurePublicUserRecord failed:", error.message, {
      userId,
    });
    throw AppError.internal(`Failed to sync user record: ${error.message}`);
  }
}

export async function createCheckoutSession(userId: string, email: string) {
  const s = getStripe();
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) throw AppError.internal("STRIPE_PRICE_ID not configured");

  if (isSupabaseConfigured()) {
    await ensurePublicUserRecord(userId, email);
  }

  let customerId: string | undefined;
  if (isSupabaseConfigured()) {
    const { data } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();
    if (data?.stripe_customer_id) {
      customerId = data.stripe_customer_id;
    }
  }

  const session = await s.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    customer: customerId,
    customer_email: customerId ? undefined : email,
    success_url: `${process.env.STRIPE_SUCCESS_URL || "https://quill.app/success"}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: process.env.STRIPE_CANCEL_URL || "https://quill.app/cancel",
    metadata: { userId, planName: PAID_PLAN_NAME },
  });

  return { url: session.url, sessionId: session.id };
}

export async function createPortalSession(userId: string) {
  const s = getStripe();

  if (!isSupabaseConfigured()) throw AppError.internal("Database not configured");

  const { data } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single();

  if (!data?.stripe_customer_id)
    throw AppError.badRequest("No billing account found");

  const session = await s.billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: process.env.STRIPE_RETURN_URL || "https://quill.app",
  });

  return { url: session.url };
}

export async function handleWebhookEvent(rawBody: Buffer, signature: string) {
  const s = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw AppError.internal("STRIPE_WEBHOOK_SECRET not configured");
  if (!Buffer.isBuffer(rawBody)) {
    throw AppError.badRequest("Invalid webhook payload");
  }

  const event = s.webhooks.constructEvent(rawBody, signature, webhookSecret);
  if (isDuplicateWebhookEvent(event.id)) return;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await onCheckoutComplete(session);
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await onSubscriptionUpdated(subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await onSubscriptionDeleted(subscription);
      break;
    }
  }
}

function isDuplicateWebhookEvent(eventId: string): boolean {
  const now = Date.now();
  for (const [id, createdAt] of processedWebhookEvents.entries()) {
    if (now - createdAt > WEBHOOK_EVENT_TTL_MS) {
      processedWebhookEvents.delete(id);
    }
  }

  if (processedWebhookEvents.has(eventId)) {
    return true;
  }

  processedWebhookEvents.set(eventId, now);
  return false;
}

async function onCheckoutComplete(session: Stripe.Checkout.Session) {
  if (!isSupabaseConfigured()) return;
  const userId = session.metadata?.userId;
  if (!userId || !session.subscription) return;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId || null,
      stripe_subscription_id: subscriptionId,
      plan_name: PAID_PLAN_NAME,
      status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );
  if (error) {
    console.error("[billing] onCheckoutComplete upsert failed:", error.message, {
      userId,
      subscriptionId,
    });
    throw AppError.internal(`Subscription upsert failed: ${error.message}`);
  }
}

async function onSubscriptionUpdated(subscription: Stripe.Subscription) {
  if (!isSupabaseConfigured()) return;

  const subscriptionAny = subscription as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  };
  const isPaidStatus = ["active", "trialing", "past_due"].includes(
    subscription.status
  );
  const update: Record<string, unknown> = {
    status: subscription.status,
    plan_name: isPaidStatus ? PAID_PLAN_NAME : "free",
    updated_at: new Date().toISOString(),
  };
  if (subscriptionAny.current_period_start) {
    update.current_period_start = new Date(
      subscriptionAny.current_period_start * 1000
    ).toISOString();
  }
  if (subscriptionAny.current_period_end) {
    update.current_period_end = new Date(
      subscriptionAny.current_period_end * 1000
    ).toISOString();
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .update(update)
    .eq("stripe_subscription_id", subscription.id)
    .select("user_id")
    .maybeSingle();

  if (error) throw AppError.internal(`Failed to update subscription: ${error.message}`);

  if (data?.user_id) return;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  if (!customerId) return;

  const { error: customerUpdateError } = await supabase
    .from("subscriptions")
    .update(update)
    .eq("stripe_customer_id", customerId);
  if (customerUpdateError) {
    console.error(
      "[billing] onSubscriptionUpdated customer fallback failed:",
      customerUpdateError.message,
      { customerId, subscriptionId: subscription.id }
    );
    throw AppError.internal(
      `Failed to update subscription by customer: ${customerUpdateError.message}`
    );
  }
}

async function onSubscriptionDeleted(subscription: Stripe.Subscription) {
  if (!isSupabaseConfigured()) return;

  const update = {
    plan_name: "free",
    status: "canceled",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("subscriptions")
    .update(update)
    .eq("stripe_subscription_id", subscription.id)
    .select("user_id")
    .maybeSingle();

  if (error) throw AppError.internal(`Failed to cancel subscription: ${error.message}`);
  if (data?.user_id) return;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;
  if (!customerId) return;

  const { error: customerCancelError } = await supabase
    .from("subscriptions")
    .update(update)
    .eq("stripe_customer_id", customerId);
  if (customerCancelError) {
    console.error(
      "[billing] onSubscriptionDeleted customer fallback failed:",
      customerCancelError.message,
      { customerId, subscriptionId: subscription.id }
    );
    throw AppError.internal(
      `Failed to cancel subscription by customer: ${customerCancelError.message}`
    );
  }
}
