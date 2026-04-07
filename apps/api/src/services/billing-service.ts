import Stripe from "stripe";
import { supabase, isSupabaseConfigured } from "../db/supabase.js";
import { AppError } from "../utils/app-error.js";

let stripe: Stripe | null = null;
const PAID_PLAN_NAME = "plus";

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

export async function createCheckoutSession(userId: string, email: string) {
  const s = getStripe();
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) throw AppError.internal("STRIPE_PRICE_ID not configured");

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

  const event = s.webhooks.constructEvent(rawBody, signature, webhookSecret);

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

  await supabase.from("subscriptions").upsert(
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

  await supabase
    .from("subscriptions")
    .update(update)
    .eq("stripe_subscription_id", subscription.id);
}

async function onSubscriptionDeleted(subscription: Stripe.Subscription) {
  if (!isSupabaseConfigured()) return;

  await supabase
    .from("subscriptions")
    .update({
      plan_name: "free",
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);
}
