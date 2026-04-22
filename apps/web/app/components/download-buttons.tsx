"use client";

import { useMemo } from "react";

type Platform = "mac" | "windows" | "linux";

const DOWNLOAD_URLS: Record<Platform, string> = {
  mac: process.env.NEXT_PUBLIC_DOWNLOAD_URL_MAC || "https://downloads.quill.app/mac/latest.dmg",
  windows:
    process.env.NEXT_PUBLIC_DOWNLOAD_URL_WINDOWS ||
    "https://downloads.quill.app/win/latest.exe",
  linux: process.env.NEXT_PUBLIC_DOWNLOAD_URL_LINUX || "https://downloads.quill.app/linux",
};

function detectPlatform(): Platform {
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
}

function getPrimaryLabel(platform: Platform): string {
  if (platform === "mac") return "Download for macOS";
  if (platform === "windows") return "Download for Windows";
  return "Download for Linux";
}

export function PrimaryDownloadCta({ location }: { location: string }) {
  const platform = useMemo(() => detectPlatform(), []);
  const primaryHref = DOWNLOAD_URLS[platform];

  return (
    <a
      href={primaryHref}
      onClick={() => trackCta("download_clicked", { location, platform })}
      className="btn btnPrimary"
    >
      {getPrimaryLabel(platform)}
    </a>
  );
}

export function DownloadLinks({ location }: { location: string }) {
  return (
    <div className="downloadLinks">
      <a
        href={DOWNLOAD_URLS.mac}
        onClick={() => trackCta("download_clicked", { location, platform: "mac" })}
      >
        macOS
      </a>
      <a
        href={DOWNLOAD_URLS.windows}
        onClick={() => trackCta("download_clicked", { location, platform: "windows" })}
      >
        Windows
      </a>
      <a
        href={DOWNLOAD_URLS.linux}
        onClick={() => trackCta("download_clicked", { location, platform: "linux" })}
      >
        Linux
      </a>
    </div>
  );
}
