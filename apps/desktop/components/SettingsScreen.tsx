"use client";

import { useCallback, useMemo, useState } from "react";
import { useIdentityStore } from "@/stores/identity-store";
import { useUsageStore } from "@/stores/usage-store";

interface SettingsScreenProps {
  onClose: () => void;
}

export default function SettingsScreen({ onClose }: SettingsScreenProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const user = useIdentityStore((s) => s.user);
  const ownerType = useIdentityStore((s) => s.ownerType);
  const getHeaders = useIdentityStore((s) => s.getHeaders);
  const fetchUsage = useUsageStore((s) => s.fetchUsage);
  const { totalTokens, limit, remaining, warning, blocked, tier } = useUsageStore();
  const [isBusy, setIsBusy] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  const percentage =
    limit > 0 ? Math.min(100, Math.round((totalTokens / limit) * 100)) : 0;
  const planLabel = useMemo(() => {
    if (tier === "paid") return "Plus";
    if (ownerType === "user") return "Free";
    return "Guest";
  }, [ownerType, tier]);

  const openUpgrade = useCallback(async () => {
    if (!user?.email) return;
    setBillingError(null);
    setIsBusy(true);
    try {
      const res = await fetch(`${API_URL}/billing/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to start checkout");
      if (data.url) window.open(data.url, "_blank");
      await fetchUsage(API_URL, getHeaders());
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : "Upgrade failed");
    } finally {
      setIsBusy(false);
    }
  }, [API_URL, fetchUsage, getHeaders, user?.email]);

  const openPortal = useCallback(async () => {
    setBillingError(null);
    setIsBusy(true);
    try {
      const res = await fetch(`${API_URL}/billing/create-customer-portal-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getHeaders() },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to open billing portal");
      if (data.url) window.open(data.url, "_blank");
      await fetchUsage(API_URL, getHeaders());
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : "Unable to open portal");
    } finally {
      setIsBusy(false);
    }
  }, [API_URL, fetchUsage, getHeaders]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
        <h2 className="text-sm font-medium text-white/70">Settings</h2>
        <button
          onClick={onClose}
          className="text-xs text-white/40 hover:text-white/60 transition"
        >
          Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Account */}
        <section>
          <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
            Account
          </h3>
          <div className="bg-white/5 rounded-lg p-3 space-y-2">
            <p className="text-sm">{user ? user.email : "Guest Mode"}</p>
            <p className="text-xs text-white/30">
              {ownerType === "user" ? "Authenticated account" : "Using as guest"}
            </p>
            <p className="text-xs text-white/50">
              Current plan: <span className="text-white/80">{planLabel}</span>
              {tier === "paid" ? " ($9/month)" : ""}
            </p>
            <div className="pt-1">
              {tier === "paid" ? (
                <button
                  onClick={openPortal}
                  disabled={isBusy}
                  className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white transition"
                >
                  Manage Subscription
                </button>
              ) : (
                <button
                  onClick={openUpgrade}
                  disabled={isBusy || !user?.email}
                  className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white transition"
                >
                  Upgrade to Plus ($9/month)
                </button>
              )}
            </div>
            {!user && (
              <p className="text-[11px] text-white/35">
                Sign in first to subscribe to Plus.
              </p>
            )}
            {billingError && (
              <p className="text-[11px] text-red-300">{billingError}</p>
            )}
          </div>
        </section>

        {/* Usage */}
        <section>
          <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
            Usage This Month
          </h3>
          <div className="bg-white/5 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>{totalTokens.toLocaleString()} tokens</span>
              <span className="text-white/40">{limit.toLocaleString()} limit</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  percentage >= 100
                    ? "bg-red-500"
                    : percentage >= 80
                    ? "bg-amber-500"
                    : "bg-blue-500"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-xs text-white/30">
              {remaining.toLocaleString()} tokens remaining
            </p>
            {blocked && (
              <p className="text-xs text-red-300">
                You have reached your monthly limit.
              </p>
            )}
            {!blocked && warning && (
              <p className="text-xs text-amber-300">
                You are nearing your monthly limit.
              </p>
            )}
          </div>
        </section>

        {/* About */}
        <section>
          <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
            About
          </h3>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-sm">Quill Desktop Assistant</p>
            <p className="text-xs text-white/30 mt-1">Version 0.0.1</p>
          </div>
        </section>
      </div>
    </div>
  );
}
