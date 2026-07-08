export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * In production builds the API must be reached over TLS so request content
 * (messages, screenshots, document context) is encrypted in transit. Plain
 * HTTP is only allowed against localhost for local development.
 */
export function isApiUrlSecure(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol === "https:") return true;
    if (process.env.NODE_ENV !== "production") return true;
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}
