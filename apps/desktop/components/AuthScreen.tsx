"use client";

import { useState, useCallback } from "react";
import { useIdentityStore } from "@/stores/identity-store";

interface AuthScreenProps {
  onClose: () => void;
}

export default function AuthScreen({ onClose }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const signIn = useIdentityStore((s) => s.signIn);
  const signUp = useIdentityStore((s) => s.signUp);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);

      const result =
        mode === "login"
          ? await signIn(email, password)
          : await signUp(email, password);

      setIsLoading(false);

      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    },
    [mode, email, password, signIn, signUp, onClose]
  );

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold">
          {mode === "login" ? "Log In" : "Sign Up"}
        </h2>
        <button
          onClick={onClose}
          className="text-xs font-medium text-white/75 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition"
        >
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-white/50 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/[0.08] outline-none focus:border-blue-500/50 transition"
          />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/[0.08] outline-none focus:border-blue-500/50 transition"
          />
        </div>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-3 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 transition font-medium disabled:opacity-50"
        >
          {isLoading
            ? "Loading..."
            : mode === "login"
            ? "Log In"
            : "Sign Up"}
        </button>
      </form>

      <p className="text-xs text-white/40 text-center mt-4">
        {mode === "login" ? (
          <>
            No account?{" "}
            <button
              onClick={() => { setMode("signup"); setError(""); }}
              className="text-blue-400 hover:text-blue-300"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className="text-blue-400 hover:text-blue-300"
            >
              Log in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
