import { Request, Response, NextFunction } from "express";
import { supabase, isSupabaseConfigured } from "../db/supabase.js";

export interface ResolvedIdentity {
  ownerType: "user" | "guest";
  ownerId: string;
}

declare global {
  namespace Express {
    interface Request {
      identity?: ResolvedIdentity;
    }
  }
}

export async function resolveIdentity(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const deviceId = req.headers["x-device-id"];

  if (authHeader && authHeader.startsWith("Bearer ") && isSupabaseConfigured()) {
    const token = authHeader.slice(7);
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        req.identity = {
          ownerType: "user",
          ownerId: user.id,
        };
        next();
        return;
      }
    } catch {
      // Fall through to guest
    }
  }

  if (deviceId) {
    req.identity = {
      ownerType: "guest",
      ownerId: String(deviceId),
    };
  }

  next();
}
