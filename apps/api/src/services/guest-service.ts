import { supabase } from "../db/supabase.js";
import { AppError } from "../utils/app-error.js";

export async function initGuest(deviceId: string) {
  const { data: existing } = await supabase
    .from("guest_devices")
    .select("*")
    .eq("device_id", deviceId)
    .single();

  if (existing) {
    await supabase
      .from("guest_devices")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("device_id", deviceId);
    return existing;
  }

  const { data, error } = await supabase
    .from("guest_devices")
    .insert({ device_id: deviceId })
    .select()
    .single();

  if (error)
    throw AppError.internal(`Failed to create guest device: ${error.message}`);
  return data;
}

export async function getGuestDevice(deviceId: string) {
  const { data } = await supabase
    .from("guest_devices")
    .select("*")
    .eq("device_id", deviceId)
    .single();

  return data;
}
