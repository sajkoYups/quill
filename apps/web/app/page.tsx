import Image from "next/image";
import { DownloadLinks, PrimaryDownloadCta } from "./components/download-buttons";

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Quill",
  operatingSystem: "macOS, Windows, Linux",
  applicationCategory: "ProductivityApplication",
  description:
    "Quill is a desktop AI assistant that understands screenshots and documents, then gives context-aware help while you work.",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "0",
    highPrice: "9",
    offerCount: 3,
    offers: [
      {
        "@type": "Offer",
        name: "Guest Free",
        price: "0",
      },
      {
        "@type": "Offer",
        name: "Account Free",
        price: "0",
      },
      {
        "@type": "Offer",
        name: "Plus",
        price: "9",
      },
    ],
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Quill?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Quill is a desktop AI assistant designed to stay beside your work and use screenshots or documents as context.",
      },
    },
    {
      "@type": "Question",
      name: "Does Quill support macOS, Windows, and Linux?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Quill provides download options for macOS, Windows, and Linux.",
      },
    },
    {
      "@type": "Question",
      name: "How is billing handled in Quill?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Quill offers two free tiers and one paid tier. Plus billing is managed inside the Quill desktop app settings.",
      },
    },
  ],
};

export default function Page() {
  return (
    <main className="landingRoot">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <header className="topNav">
        <a href="/" className="brand">
          <Image src="/logo.png" alt="Quill logo" width={38} height={38} priority />
          <span>Quill</span>
        </a>
        <nav className="topLinks" aria-label="Primary">
          <a href="#features">Features</a>
          <a href="#trust">Trust</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>
      </header>

      <section className="section hero">
        <p className="eyebrow">Desktop AI Assistant</p>
        <h1>Context-aware AI help beside your work, not in another tab.</h1>
        <p className="lead">
          Quill is built for teams that move fast. Pin it on your desktop, attach screenshots
          and docs, and get focused help with less context switching.
        </p>
        <div className="ctaRow">
          <PrimaryDownloadCta location="hero" />
          <a href="#product" className="btn btnSecondary">
            See what Quill builds
          </a>
        </div>
        <p className="subtleLine">Built for builders, operators, and product teams shipping every day.</p>
      </section>

      <section id="product" className="section">
        <h2>What we are building at Quill</h2>
        <div className="grid3">
          <article className="card">
            <h3>Desktop-native workflow</h3>
            <p>Keep Quill pinned while coding, writing specs, reviewing docs, or debugging incidents.</p>
          </article>
          <article className="card">
            <h3>Visual context understanding</h3>
            <p>Drop screenshots and files directly into Quill for answers grounded in your real workflow.</p>
          </article>
          <article className="card">
            <h3>Actionable outputs</h3>
            <p>Go from question to next action quickly with responses focused on implementation and execution.</p>
          </article>
        </div>
      </section>

      <section id="features" className="section">
        <h2>Why teams choose Quill</h2>
        <ul className="featureList">
          <li>Desktop-first AI assistant designed for deep work and faster iteration.</li>
          <li>Screenshot-aware and document-aware conversations for richer context.</li>
          <li>Simple pricing with in-app billing and clear plan boundaries.</li>
          <li>Cross-platform downloads across macOS, Windows, and Linux.</li>
        </ul>
      </section>

      <section id="trust" className="section">
        <h2>Trust, privacy, and product transparency</h2>
        <div className="grid2">
          <article className="card">
            <h3>Transparent billing</h3>
            <p>Manage your Plus subscription directly in the desktop app settings with clear monthly pricing.</p>
          </article>
          <article className="card">
            <h3>Built for practical use</h3>
            <p>
              Quill focuses on real workflows: screenshot-driven debugging, document Q&A, and desktop-native productivity.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <h2>Customer voice</h2>
        <div className="grid3">
          <blockquote className="quoteCard">
            <p>"Quill cuts the time between discovering an issue and shipping the fix."</p>
            <cite>Engineering Lead, SaaS Team</cite>
          </blockquote>
          <blockquote className="quoteCard">
            <p>"The screenshot-aware flow is exactly what our support and product teams needed."</p>
            <cite>Product Manager, B2B Platform</cite>
          </blockquote>
          <blockquote className="quoteCard">
            <p>"We keep Quill open all day. It feels like a focused teammate, not another chat tab."</p>
            <cite>Founder, Startup Studio</cite>
          </blockquote>
        </div>
      </section>

      <section className="section">
        <h2>Usage and momentum</h2>
        <div className="grid3">
          <article className="metricCard">
            <p className="metricValue">Cross-platform</p>
            <p className="metricLabel">Available on macOS, Windows, and Linux</p>
          </article>
          <article className="metricCard">
            <p className="metricValue">Context-first</p>
            <p className="metricLabel">Supports screenshot and document-driven prompts</p>
          </article>
          <article className="metricCard">
            <p className="metricValue">Fast setup</p>
            <p className="metricLabel">Download, install, and start within minutes</p>
          </article>
        </div>
      </section>

      <section id="pricing" className="section">
        <h2>Pricing</h2>
        <div className="pricingGrid">
          <article className="pricingCard">
            <p className="planBadge">No account required</p>
            <h3>Guest Free</h3>
            <p className="price">$0<span>/month</span></p>
            <p>Start instantly without login with a small monthly token allowance (up to 50,000 tokens).</p>
          </article>

          <article className="pricingCard">
            <p className="planBadge">Account required</p>
            <h3>Account Free</h3>
            <p className="price">$0<span>/month</span></p>
            <p>Create an account to unlock a larger free monthly allowance (up to 200,000 tokens).</p>
          </article>

          <article className="pricingCard pricingCardFeatured">
            <p className="planBadge planBadgeAccent">Best for daily use</p>
            <h3>Plus</h3>
            <p className="price">$9<span>/month</span></p>
            <p>For enormous monthly usage with up to 2,000,000 tokens and the best experience for heavy workflows.</p>
            {/* <PrimaryDownloadCta location="pricing_plus" /> */}
          </article>
        </div>
      </section>

      <section className="section finalCta">
        <h2>Start with Quill today</h2>
        <p>Use Quill as your desktop productivity AI assistant for focused execution and faster shipping.</p>
        <div className="ctaRow">
          <PrimaryDownloadCta location="final_cta" />
          <a href="#faq" className="btn btnSecondary">
            Read FAQs
          </a>
        </div>
        <DownloadLinks location="footer_downloads" />
      </section>

      <section id="faq" className="section faq">
        <h2>Frequently asked questions</h2>
        <article>
          <h3>Is Quill a desktop AI assistant?</h3>
          <p>Yes. Quill is designed specifically as a desktop AI assistant for day-to-day work.</p>
        </article>
        <article>
          <h3>Can Quill use screenshots and documents as context?</h3>
          <p>Yes. You can attach screenshots and files to get more relevant, context-aware responses.</p>
        </article>
        <article>
          <h3>How do I start using Quill?</h3>
          <p>Download Quill for your platform, install it, then start asking questions with your project context.</p>
        </article>
      </section>
    </main>
  );
}
