import { Request, Response, NextFunction } from "express";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Baseline transport-security headers. TLS itself is terminated by the host
 * (e.g. Render) at the edge; HSTS instructs clients to only use HTTPS going forward.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (isProduction) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );

    // Behind a TLS-terminating proxy, reject plain HTTP requests.
    const forwardedProto = req.headers["x-forwarded-proto"];
    if (typeof forwardedProto === "string" && forwardedProto.split(",")[0].trim() === "http") {
      res.status(403).json({ error: "HTTPS is required" });
      return;
    }
  }

  next();
}
