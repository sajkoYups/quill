import { Request, Response, NextFunction } from "express";
import * as billingService from "../services/billing-service.js";
import { AppError } from "../utils/app-error.js";

export async function handleCreateCheckoutSession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.identity || req.identity.ownerType !== "user")
      throw AppError.unauthorized("Must be logged in to subscribe");

    const { email } = req.body;
    const result = await billingService.createCheckoutSession(
      req.identity.ownerId,
      email
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleCreatePortalSession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.identity || req.identity.ownerType !== "user")
      throw AppError.unauthorized("Must be logged in");

    const result = await billingService.createPortalSession(
      req.identity.ownerId
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleStripeWebhook(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const signature = req.headers["stripe-signature"];
    if (!signature) throw AppError.badRequest("Missing stripe-signature header");
    if (!Buffer.isBuffer(req.body)) {
      throw AppError.badRequest("Stripe webhook requires raw body");
    }

    await billingService.handleWebhookEvent(
      req.body,
      String(signature)
    );
    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}
