import { create } from "zustand";

interface UsageState {
  totalTokens: number;
  limit: number;
  remaining: number;
  warning: boolean;
  blocked: boolean;

  fetchUsage: (apiUrl: string, headers: Record<string, string>) => Promise<void>;
  setBlocked: (blocked: boolean) => void;
}

export const useUsageStore = create<UsageState>((set) => ({
  totalTokens: 0,
  limit: 10000,
  remaining: 10000,
  warning: false,
  blocked: false,

  fetchUsage: async (apiUrl, headers) => {
    try {
      const res = await fetch(`${apiUrl}/usage/me`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      set({
        totalTokens: data.totalTokens,
        limit: data.limit,
        remaining: data.remaining,
        warning: data.warning,
        blocked: data.remaining <= 0,
      });
    } catch (err) {
      console.warn("[usage] Failed to fetch usage:", err);
    }
  },

  setBlocked: (blocked) => set({ blocked }),
}));
