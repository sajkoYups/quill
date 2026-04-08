"use client";

import { useMemo } from "react";

const DOWNLOAD_URLS = {
  mac: process.env.NEXT_PUBLIC_DOWNLOAD_URL_MAC || "https://downloads.quill.app/mac",
  windows:
    process.env.NEXT_PUBLIC_DOWNLOAD_URL_WINDOWS ||
    "https://downloads.quill.app/windows",
  linux:
    process.env.NEXT_PUBLIC_DOWNLOAD_URL_LINUX || "https://downloads.quill.app/linux",
};

function detectPlatform(): "mac" | "windows" | "linux" {
  if (typeof navigator === "undefined") return "mac";
  const value = `${navigator.userAgent} ${navigator.platform}`.toLowerCase();
  if (value.includes("win")) return "windows";
  if (value.includes("linux")) return "linux";
  return "mac";
}

function trackCta(eventName: string, metadata: Record<string, string>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("quill:analytics", { detail: { eventName, ...metadata } })
  );
  console.info("[analytics]", eventName, metadata);
}

export default function Page() {
  const platform = useMemo(() => detectPlatform(), []);
  const primaryHref = DOWNLOAD_URLS[platform];
  const primaryLabel =
    platform === "mac"
      ? "Download for macOS"
      : platform === "windows"
        ? "Download for Windows"
        : "Download for Linux";

  return (
    <main
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "56px 24px 80px",
      }}
    >
      <section style={{ marginBottom: 44 }}>
        <p style={{ color: "#9fb0cb", fontWeight: 600, marginBottom: 10 }}>
          Quill Desktop
        </p>
        <h1 style={{ fontSize: 44, lineHeight: 1.1, margin: "0 0 16px" }}>
          AI help beside your work, not in another tab.
        </h1>
        <p style={{ color: "#c7d3e8", maxWidth: 720, fontSize: 18 }}>
          Quill stays pinned to your desktop, understands screenshots and docs,
          and keeps your workflow fast. Subscription billing is handled directly
          inside the app.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
          <a
            href={primaryHref}
            onClick={() =>
              trackCta("download_clicked", { location: "hero", platform })
            }
            style={{
              background: "#2f67ff",
              borderRadius: 10,
              padding: "12px 18px",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            {primaryLabel}
          </a>
          <a
            href="#pricing"
            style={{
              background: "#1a2538",
              borderRadius: 10,
              padding: "12px 18px",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            View pricing
          </a>
        </div>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 28, marginBottom: 14 }}>Why teams use Quill</h2>
        <ul style={{ color: "#ccdaef", lineHeight: 1.7 }}>
          <li>Desktop-first workflow with pin/minimize support.</li>
          <li>Attach screenshots and documents for better AI context.</li>
          <li>Simple plan model: free tier and Plus subscription in-app.</li>
        </ul>
      </section>

      <section id="pricing" style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 28, marginBottom: 14 }}>Pricing</h2>
        <div
          style={{
            border: "1px solid #27364f",
            borderRadius: 12,
            padding: 20,
            background: "#111a2a",
          }}
        >
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Plus - $9/month</p>
          <p style={{ margin: 0, color: "#c8d5ea" }}>
            Subscribe and manage billing from the Quill desktop app settings.
          </p>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 28, marginBottom: 14 }}>Downloads</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a
            href={DOWNLOAD_URLS.mac}
            onClick={() => trackCta("download_clicked", { location: "footer", platform: "mac" })}
          >
            macOS
          </a>
          <a
            href={DOWNLOAD_URLS.windows}
            onClick={() =>
              trackCta("download_clicked", {
                location: "footer",
                platform: "windows",
              })
            }
          >
            Windows
          </a>
          <a
            href={DOWNLOAD_URLS.linux}
            onClick={() =>
              trackCta("download_clicked", { location: "footer", platform: "linux" })
            }
          >
            Linux
          </a>
        </div>
      </section>
    </main>
  );
}
