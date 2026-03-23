import { Router } from "express";
import {
  handleGetSettings,
  handleUpdateSettings,
} from "../controllers/settings-controller.js";

const router = Router();

router.get("/settings", handleGetSettings);
router.put("/settings", handleUpdateSettings);

export default router;
