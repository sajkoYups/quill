import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { handleGuestInit, handleGetMe } from "../controllers/auth-controller.js";

const guestInitSchema = z.object({
  deviceId: z.string().min(1),
});

const router = Router();

router.post("/auth/guest/init", validate(guestInitSchema), handleGuestInit);
router.get("/auth/me", handleGetMe);

export default router;
