import { create } from "zustand";
import { getSupabase, isSupabaseAuthConfigured } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface IdentityState {
  deviceId: string | null;
  ownerType: "user" | "guest";
  ownerId: string | null;
  user: User | null;
  session: Session | null;
  isInitialized: boolean;

  initGuest: (apiUrl: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  getHeaders: () => Record<string, string>;
}

export const useIdentityStore = create<IdentityState>((set, get) => ({
  deviceId: null,
  ownerType: "guest",
  ownerId: null,
  user: null,
  session: null,
  isInitialized: false,

  initGuest: async (apiUrl: string) => {
    let deviceId: string;
    if (window.electronAPI) {
      deviceId = await window.electronAPI.getDeviceId();
    } else {
      deviceId = localStorage.getItem("quill_device_id") || crypto.randomUUID();
      localStorage.setItem("quill_device_id", deviceId);
    }

    set({ deviceId });

    const sb = getSupabase();
    if (sb && isSupabaseAuthConfigured()) {
      const { data: { session } } = await sb.auth.getSession();
      if (session?.user) {
        set({
          ownerType: "user",
          ownerId: session.user.id,
          user: session.user,
          session,
          isInitialized: true,
        });

        sb.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            set({
              ownerType: "user",
              ownerId: session.user.id,
              user: session.user,
              session,
            });
          } else {
            const { deviceId } = get();
            set({
              ownerType: "guest",
              ownerId: deviceId,
              user: null,
              session: null,
            });
          }
        });

        return;
      }
    }

    set({ ownerType: "guest", ownerId: deviceId });

    try {
      await fetch(`${apiUrl}/auth/guest/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });
    } catch (err) {
      console.warn("[identity] Guest init failed:", err);
    }

    set({ isInitialized: true });
  },

  signUp: async (email, password) => {
    const sb = getSupabase();
    if (!sb) return { error: "Auth not configured" };
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (data.user && data.session) {
      set({
        ownerType: "user",
        ownerId: data.user.id,
        user: data.user,
        session: data.session,
      });
    }
    return {};
  },

  signIn: async (email, password) => {
    const sb = getSupabase();
    if (!sb) return { error: "Auth not configured" };
    const { data, error } = await sb.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };
    set({
      ownerType: "user",
      ownerId: data.user.id,
      user: data.user,
      session: data.session,
    });
    return {};
  },

  signOut: async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    const { deviceId } = get();
    set({
      ownerType: "guest",
      ownerId: deviceId,
      user: null,
      session: null,
    });
  },

  getHeaders: () => {
    const { ownerType, ownerId, deviceId, session } = get();
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    if (deviceId) headers["x-device-id"] = deviceId;
    headers["x-owner-type"] = ownerType;
    if (ownerId) headers["x-owner-id"] = ownerId;
    return headers;
  },
}));
