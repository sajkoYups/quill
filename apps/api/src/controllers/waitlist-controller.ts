import { Request, Response, NextFunction } from "express";
import { signupWaitlist } from "../services/waitlist-service.js";

export async function handleWaitlistSignup(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await signupWaitlist({
      ...req.body,
      clientIp: req.ip,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
