import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { handleWaitlistSignup } from "../controllers/waitlist-controller.js";

const waitlistSignupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120).optional(),
  source: z.string().min(1).max(80).optional(),
  platform: z.string().min(1).max(40).optional(),
  recaptchaToken: z.string().min(1),
});

const router = Router();

router.post("/waitlist/signup", validate(waitlistSignupSchema), handleWaitlistSignup);

export default router;
