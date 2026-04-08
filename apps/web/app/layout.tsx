import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quill | Desktop AI Assistant",
  description:
    "Quill is a desktop AI assistant for fast context-aware help while you work.",
  openGraph: {
    title: "Quill | Desktop AI Assistant",
    description:
      "Quill is a desktop AI assistant for fast context-aware help while you work.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quill | Desktop AI Assistant",
    description:
      "Quill is a desktop AI assistant for fast context-aware help while you work.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
