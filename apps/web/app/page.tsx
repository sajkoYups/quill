import Image from "next/image";
import { DownloadLinks, PrimaryDownloadCta } from "./components/download-buttons";

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Quill",
  operatingSystem: "macOS, Windows, Linux",
  applicationCategory: "ProductivityApplication",
  description:
    "Quill is an easy desktop AI assistant for companies, professionals, students, and everyday users. It uses screenshot and document context while keeping data handling privacy-first.",
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
        text: "Quill is an easy desktop AI assistant for companies, professionals, students, and anyone who wants practical AI help without a steep learning curve.",
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
    {
      "@type": "Question",
      name: "How does Quill handle my data?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Quill encrypts data in transit and at rest. Quill does not use your data to train models.",
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
        <p className="eyebrow">Easy, Privacy-First Desktop AI</p>
        <h1>The desktop AI assistant for companies, professionals, students, and everyday users.</h1>
        <p className="lead">
          Quill makes AI practical from day one. Keep it beside your work, attach screenshots and
          documents, and get clear answers without extra setup or context switching.
        </p>
        <div className="ctaRow">
          <PrimaryDownloadCta location="hero" />
          <a href="#product" className="btn btnSecondary">
            See how Quill works
          </a>
        </div>
        <p className="subtleLine">
          Built for teams and individuals who want fast results, simple workflows, and clear
          privacy expectations.
        </p>
      </section>

      <section id="product" className="section">
        <h2>Why people choose Quill</h2>
        <div className="grid3">
          <article className="card">
            <h3>Simple desktop-native workflow</h3>
            <p>
              Keep Quill pinned while coding, writing, studying, or reviewing docs without
              learning complex AI tooling.
            </p>
          </article>
          <article className="card">
            <h3>Visual and document context</h3>
            <p>
              Drop screenshots and files directly into Quill for answers grounded in your real
              task, not generic output.
            </p>
          </article>
          <article className="card">
            <h3>Actionable answers for real users</h3>
            <p>
              Go from question to next action quickly whether you are part of a company team, an
              independent professional, or a student.
            </p>
          </article>
        </div>
      </section>

      <section id="features" className="section">
        <h2>Designed for work and study</h2>
        <ul className="featureList">
          <li>Built for companies, professionals, students, and users who prefer simpler AI workflows.</li>
          <li>Desktop-first assistant designed for deep work, study sessions, and faster iteration.</li>
          <li>Screenshot-aware and document-aware conversations for richer, task-specific context.</li>
          <li>Transparent plans: two free options and Plus for very high monthly usage.</li>
          <li>Cross-platform downloads across macOS, Windows, and Linux.</li>
        </ul>
      </section>

      <section id="trust" className="section">
        <h2>Trust, privacy, and product transparency</h2>
        <div className="grid2">
          <article className="card">
            <h3>Clear data handling</h3>
            <p>
              Quill encrypts data in transit and at rest. We do not use your data to train models.
            </p>
          </article>
          <article className="card">
            <h3>Transparent plans and billing</h3>
            <p>
              Start without an account, create a free account for more monthly usage, or upgrade
              to Plus. Paid billing is managed directly in the app settings.
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
            <PrimaryDownloadCta location="pricing_plus" />
          </article>
        </div>
      </section>

      <section className="section finalCta">
        <h2>Start with Quill in minutes</h2>
        <p>
          Download Quill and start with Guest Free. Create an account later if you want more
          monthly usage.
        </p>
        <div className="ctaRow">
          <PrimaryDownloadCta location="final_cta" />
          <a href="#faq" className="btn btnSecondary">
            Compare plans and FAQs
          </a>
        </div>
        <DownloadLinks location="footer_downloads" />
      </section>

      <section id="faq" className="section faq">
        <h2>Frequently asked questions</h2>
        <article>
          <h3>Who is Quill for?</h3>
          <p>
            Quill is for companies, professionals, students, and everyday users who want simple,
            useful AI help without a heavy learning curve.
          </p>
        </article>
        <article>
          <h3>How does Quill handle my data?</h3>
          <p>
            Quill encrypts data in transit and at rest, and Quill does not use your data to train models.
          </p>
        </article>
        <article>
          <h3>Can Quill use screenshots and documents as context?</h3>
          <p>
            Yes. You can attach screenshots and files to get more relevant, context-aware
            responses.
          </p>
        </article>
        <article>
          <h3>How do I start using Quill?</h3>
          <p>
            Download Quill for your platform and start right away with Guest Free, then create an
            account later if you want more monthly usage.
          </p>
        </article>
      </section>
    </main>
  );
}
