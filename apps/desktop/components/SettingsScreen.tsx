"use client";

import { useIdentityStore } from "@/stores/identity-store";
import { useUsageStore } from "@/stores/usage-store";

interface SettingsScreenProps {
  onClose: () => void;
}

export default function SettingsScreen({ onClose }: SettingsScreenProps) {
  const user = useIdentityStore((s) => s.user);
  const ownerType = useIdentityStore((s) => s.ownerType);
  const { totalTokens, limit, remaining } = useUsageStore();

  const percentage = limit > 0 ? Math.min(100, Math.round((totalTokens / limit) * 100)) : 0;

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
          <div className="bg-white/5 rounded-lg p-3 space-y-1">
            <p className="text-sm">
              {user ? user.email : "Guest Mode"}
            </p>
            <p className="text-xs text-white/30">
              {ownerType === "user" ? "Authenticated" : "Using as guest"}
            </p>
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
