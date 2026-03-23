import { Router } from "express";
import { handleGetUsage } from "../controllers/usage-controller.js";

const router = Router();

router.get("/usage/me", handleGetUsage);

export default router;
