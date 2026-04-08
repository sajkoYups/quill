"use client";

import { useCallback } from "react";
import { useUsageStore } from "@/stores/usage-store";
import { useIdentityStore } from "@/stores/identity-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function UsageBanner() {
  const { warning, blocked, totalTokens, limit, tier } = useUsageStore();
  const user = useIdentityStore((s) => s.user);
  const getHeaders = useIdentityStore((s) => s.getHeaders);

  const handleUpgrade = useCallback(async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`${API_URL}/billing/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Upgrade failed:", err);
    }
  }, [user, getHeaders]);

  if (!warning && !blocked) return null;

  const percentage = Math.min(100, Math.round((totalTokens / limit) * 100));
  const showUpgrade = tier !== "paid" && !!user;
  const actionLabel = "Upgrade to Plus";

  if (blocked) {
    return (
      <div className="px-4 py-2 bg-red-900/40 border-b border-red-500/20 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-red-300 break-words min-w-0">
          Usage limit reached ({percentage}%). {tier === "guest" ? "Sign in and upgrade to Plus for more tokens." : "Upgrade to Plus for more tokens."}
        </p>
        {showUpgrade && (
          <button
            onClick={handleUpgrade}
            className="text-xs px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white transition"
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-2 bg-amber-900/30 border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs text-amber-300 break-words min-w-0">
        Nearing usage limit ({percentage}% used).
      </p>
      {showUpgrade && (
        <button
          onClick={handleUpgrade}
          className="text-xs px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
