import { Request, Response, NextFunction } from "express";
import { supabase, isSupabaseConfigured } from "../db/supabase.js";
import { AppError } from "../utils/app-error.js";

export async function handleGetSettings(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.identity) throw AppError.unauthorized();
    if (!isSupabaseConfigured()) {
      res.json({ theme: "dark", sidebar_pinned: true, sidebar_minimized: false });
      return;
    }

    const { data } = await supabase
      .from("settings")
      .select("*")
      .eq("owner_type", req.identity.ownerType)
      .eq("owner_id", req.identity.ownerId)
      .single();

    res.json(data || { theme: "dark", sidebar_pinned: true, sidebar_minimized: false });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateSettings(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.identity) throw AppError.unauthorized();
    if (!isSupabaseConfigured()) {
      res.json({ ok: true });
      return;
    }

    const { theme, sidebar_pinned, sidebar_minimized } = req.body;

    await supabase.from("settings").upsert(
      {
        owner_type: req.identity.ownerType,
        owner_id: req.identity.ownerId,
        ...(theme !== undefined && { theme }),
        ...(sidebar_pinned !== undefined && { sidebar_pinned }),
        ...(sidebar_minimized !== undefined && { sidebar_minimized }),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_type,owner_id" }
    );

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
