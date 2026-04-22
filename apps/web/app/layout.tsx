import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://quill.app"),
  title: "Quill | Desktop AI Assistant for Context-Aware Work",
  description:
    "Quill is a desktop AI assistant that understands screenshots and docs, helping teams ship faster with context-aware AI support.",
  keywords: [
    "desktop AI assistant",
    "AI assistant for developers",
    "context-aware AI",
    "screenshot-aware AI assistant",
    "document-aware AI helper",
    "desktop productivity AI",
    "Quill app",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Quill | Desktop AI Assistant for Context-Aware Work",
    description:
      "Quill is a desktop AI assistant that understands screenshots and docs, helping teams ship faster with context-aware AI support.",
    type: "website",
    url: "https://quill.app",
    siteName: "Quill",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Quill desktop AI assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quill | Desktop AI Assistant for Context-Aware Work",
    description:
      "Quill is a desktop AI assistant that understands screenshots and docs, helping teams ship faster with context-aware AI support.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Quill",
    url: "https://quill.app",
    logo: "https://quill.app/logo.png",
  };

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
