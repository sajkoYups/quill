import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error.js";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  console.error("[error]", err);
  res.status(500).json({ error: "Internal server error" });
}
