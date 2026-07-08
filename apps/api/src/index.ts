import "dotenv/config";
import express from "express";
import cors from "cors";
import { requestLogger } from "./middleware/request-logger.js";
import { securityHeaders } from "./middleware/security-headers.js";
import { resolveIdentity } from "./middleware/identity.js";
import { errorHandler } from "./middleware/error-handler.js";
import { handleStripeWebhook } from "./controllers/billing-controller.js";
import authRouter from "./routes/auth.js";
import askRouter from "./routes/ask.js";
import usageRouter from "./routes/usage.js";
import billingRouter from "./routes/billing.js";
import settingsRouter from "./routes/settings.js";
import waitlistRouter from "./routes/waitlist.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(securityHeaders);

app.post(
  "/billing/webhooks/stripe",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

app.use(express.json({ limit: "50mb" }));
app.use(requestLogger);
app.use(resolveIdentity);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(authRouter);
app.use(askRouter);
app.use(usageRouter);
app.use(billingRouter);
app.use(settingsRouter);
app.use(waitlistRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[api] Server running on http://localhost:${PORT}`);
});
