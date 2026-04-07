import { create } from "zustand";

interface UsageState {
  totalTokens: number;
  limit: number;
  remaining: number;
  warning: boolean;
  blocked: boolean;
  tier: "guest" | "free" | "paid";

  fetchUsage: (apiUrl: string, headers: Record<string, string>) => Promise<void>;
  setBlocked: (blocked: boolean) => void;
}

export const useUsageStore = create<UsageState>((set) => ({
  totalTokens: 0,
  limit: 50000,
  remaining: 50000,
  warning: false,
  blocked: false,
  tier: "guest",

  fetchUsage: async (apiUrl, headers) => {
    try {
      const res = await fetch(`${apiUrl}/usage/me`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      const tier =
        data.tier === "paid" || data.tier === "free" || data.tier === "guest"
          ? data.tier
          : "guest";
      set({
        totalTokens: data.totalTokens,
        limit: data.limit,
        remaining: data.remaining,
        warning: data.warning,
        blocked: data.remaining <= 0,
        tier,
      });
    } catch (err) {
      console.warn("[usage] Failed to fetch usage:", err);
    }
  },

  setBlocked: (blocked) => set({ blocked }),
}));
