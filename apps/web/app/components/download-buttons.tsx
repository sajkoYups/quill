"use client";

function trackCta(eventName: string, metadata: Record<string, string>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("quill:analytics", { detail: { eventName, ...metadata } })
  );
}

export function PrimaryWaitlistCta({ location }: { location: string }) {
  return (
    <a
      href="#waitlist"
      onClick={() => trackCta("waitlist_clicked", { location })}
      className="btn btnPrimary"
    >
      Join waitlist
    </a>
  );
}

export function WaitlistLinks({ location }: { location: string }) {
  return (
    <div className="downloadLinks">
      <a href="#waitlist" onClick={() => trackCta("waitlist_clicked", { location, channel: "web" })}>
        Join from web
      </a>
      <a href="#waitlist" onClick={() => trackCta("waitlist_clicked", { location, channel: "desktop" })}>
        Join for desktop
      </a>
      <a href="#waitlist" onClick={() => trackCta("waitlist_clicked", { location, channel: "teams" })}>
        Join for teams
      </a>
    </div>
  );
}
