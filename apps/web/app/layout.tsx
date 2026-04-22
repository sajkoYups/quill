import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://quill.app"),
  title: "Quill | Privacy-First Desktop AI Assistant",
  description:
    "Quill is a privacy-first desktop AI assistant for companies, professionals, students, and everyday users. Get practical help from screenshots and documents with no training on your data.",
  keywords: [
    "desktop AI assistant",
    "privacy-first AI assistant",
    "AI assistant for professionals",
    "AI assistant for students",
    "simple AI assistant",
    "context-aware AI",
    "screenshot-aware AI assistant",
    "document-aware AI helper",
    "AI assistant for work and study",
    "AI assistant that does not train on your data",
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
    title: "Quill | Privacy-First Desktop AI Assistant",
    description:
      "Quill is a privacy-first desktop AI assistant for companies, professionals, students, and everyday users. Practical help from screenshots and documents with no training on your data.",
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
    title: "Quill | Privacy-First Desktop AI Assistant",
    description:
      "Quill is a privacy-first desktop AI assistant for work and study, with encryption in transit and at rest and no training on your data.",
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
