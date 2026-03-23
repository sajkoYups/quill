import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import {
  handleCreateCheckoutSession,
  handleCreatePortalSession,
} from "../controllers/billing-controller.js";

const checkoutSchema = z.object({
  email: z.string().email(),
});

const router = Router();

router.post(
  "/billing/create-checkout-session",
  validate(checkoutSchema),
  handleCreateCheckoutSession
);
router.post("/billing/create-customer-portal-session", handleCreatePortalSession);

export default router;
