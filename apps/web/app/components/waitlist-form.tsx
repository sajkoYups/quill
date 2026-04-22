"use client";

import { FormEvent, useMemo, useState } from "react";

type SubmitState = "idle" | "loading" | "success" | "error";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function detectPlatform(): string | undefined {
  if (typeof navigator === "undefined") return undefined;
  const value = `${navigator.userAgent} ${navigator.platform}`.toLowerCase();
  if (value.includes("win")) return "windows";
  if (value.includes("linux")) return "linux";
  if (value.includes("mac")) return "mac";
  return "web";
}

function trackFormEvent(eventName: string, metadata: Record<string, string>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("quill:analytics", { detail: { eventName, ...metadata } })
  );
}

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [feedback, setFeedback] = useState("");
  const platform = useMemo(() => detectPlatform(), []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState("loading");
    setFeedback("");

    try {
      const response = await fetch(`${API_URL}/waitlist/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name || undefined,
          source: "landing-page",
          platform,
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(body?.error || "Unable to join waitlist right now.");
      }

      trackFormEvent("waitlist_submitted", {
        source: "landing-page",
        platform: platform || "unknown",
      });
      setSubmitState("success");
      setFeedback("You are on the waitlist. We will email you when downloads are live.");
      setEmail("");
      setName("");
    } catch (err) {
      setSubmitState("error");
      setFeedback(err instanceof Error ? err.message : "Unable to join waitlist right now.");
    }
  }

  return (
    <section id="waitlist" className="section">
      <h2>Waitlist is now open</h2>
      <p>Share your details and we will notify you as soon as Quill downloads are available.</p>
      <form className="waitlistForm" onSubmit={onSubmit}>
        <label className="waitlistField">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
          />
        </label>
        <label className="waitlistField">
          Name (optional)
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Jane Doe"
          />
        </label>
        <button type="submit" className="btn btnPrimary" disabled={submitState === "loading"}>
          {submitState === "loading" ? "Submitting..." : "Join waitlist"}
        </button>
      </form>
      {feedback ? (
        <p className={submitState === "error" ? "waitlistFeedbackError" : "waitlistFeedbackSuccess"}>
          {feedback}
        </p>
      ) : null}
    </section>
  );
}
