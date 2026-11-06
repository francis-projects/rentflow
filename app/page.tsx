import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PricingSection } from "@/components/pricing-section";
import { ScrollReveal } from "@/components/scroll-reveal";

const usd = (minor: number | null) => minor === null ? "Custom" : minor === 0 ? "$0" : "$" + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(minor / 100);

const features = [
  { number: "01", title: "Property & unit records", description: "Keep property details, rental units and occupancy information organised in one workspace." },
  { number: "02", title: "Tenants & leases", description: "Maintain tenant records, lease terms, rent amounts and due dates together." },
  { number: "03", title: "Rent ledger & payments", description: "Generate rent charges, record full or partial payments and keep an auditable payment history." },
  { number: "04", title: "Expenses & owner reports", description: "Record property expenses, allocate portfolio costs and prepare owner statements." },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: plans } = await supabase.from("subscription_plans")
    .select("code,name,monthly_price_minor,annual_price_minor,is_active,sort_order")
    .eq("is_active", true).order("sort_order");
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link href="/" className="landing-brand"><span className="brand-mark">R</span><span>rentflow</span></Link>
        <nav aria-label="Main navigation" className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#plans">Plans</a>
        </nav>
        <div className="landing-nav-actions">
          <Link href="/login" className="landing-signin">Sign in</Link>
          <Link href="/signup" className="landing-nav-cta">Get started <span aria-hidden="true">↗</span></Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="landing-kicker"><span /> RENTAL MANAGEMENT, MADE CLEAR</p>
          <h1>Your properties.<br /><em>Your numbers.</em><br />One clear view.</h1>
          <p className="landing-hero-text">Bring property records, tenants, leases, rent collection and expenses together in one organised workspace.</p>
          <div className="landing-hero-actions">
            <Link href="/signup" className="landing-primary-cta">Create your workspace <span aria-hidden="true">↗</span></Link>
            <Link href="/login" className="landing-secondary-cta">I already have an account</Link>
          </div>
          <div className="landing-trust-line"><span className="landing-check">✓</span> Built for practical day-to-day rental operations</div>
        </div>
        <div className="landing-visual" aria-label="Illustration of a rental portfolio dashboard">
          <div className="landing-visual-top"><div><span className="visual-dot" /> RENTFLOW / PORTFOLIO</div><span>OVERVIEW</span></div>
          <div className="visual-welcome"><div><small>YOUR WORKSPACE</small><strong>Portfolio overview</strong></div><span className="visual-date">THIS MONTH</span></div>
          <div className="visual-metrics">
            <div><small>PROPERTIES</small><strong>—</strong><span>Track your portfolio</span></div>
            <div><small>RENT COLLECTED</small><strong>USD —</strong><span>Monitor payments</span></div>
          </div>
          <div className="visual-ledger">
            <div className="visual-ledger-head"><strong>Rent ledger</strong><span>Illustrative preview</span></div>
            <div className="visual-ledger-row"><span className="visual-ledger-icon">⌂</span><div><strong>Property records</strong><small>Units and occupancy</small></div><b>→</b></div>
            <div className="visual-ledger-row"><span className="visual-ledger-icon">▤</span><div><strong>Tenant & lease details</strong><small>Terms and rent due dates</small></div><b>→</b></div>
            <div className="visual-ledger-row"><span className="visual-ledger-icon">↗</span><div><strong>Payments & expenses</strong><small>Track the money clearly</small></div><b>→</b></div>
          </div>
          <p className="visual-footnote">A workspace that starts with your records — not sample numbers.</p>
        </div>
        <div className="landing-hero-orbit" aria-hidden="true" />
      </section>

      <section className="landing-strip">
        <span>ONE WORKSPACE</span><b>Properties</b><i /> <b>Tenants</b><i /> <b>Leases</b><i /> <b>Rent</b><i /> <b>Expenses</b><i /> <b>Owner reporting</b>
      </section>

      <ScrollReveal><section className="landing-showcase">
        <div className="showcase-heading"><p className="landing-kicker">MADE FOR THE WAY YOU MANAGE</p><h2>Every property detail.<br /><em>Finally in one place.</em></h2></div>
        <div className="showcase-grid">
          <article className="showcase-card showcase-card-large">
            <div className="showcase-image" role="img" aria-label="Modern residential property exterior" style={{backgroundImage:"url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85)"}} />
            <div><span>01 / YOUR PORTFOLIO</span><h3>See the whole picture.</h3><p>Properties, units and occupancy — organised together.</p></div>
          </article>
          <article className="showcase-card">
            <div className="showcase-image" role="img" aria-label="Bright modern apartment interior" style={{backgroundImage:"url(https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85)"}} />
            <div><span>02 / YOUR TENANTS</span><h3>Keep every detail close.</h3><p>Leases, documents and tenant history in one workspace.</p></div>
          </article>
          <article className="showcase-card">
            <div className="showcase-image" role="img" aria-label="Modern apartment building architecture" style={{backgroundImage:"url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=85)"}} />
            <div><span>03 / YOUR NUMBERS</span><h3>Make decisions with clarity.</h3><p>Track collections, expenses and owner reporting.</p></div>
          </article>
        </div>
      </section></ScrollReveal>

      <ScrollReveal><section className="landing-section" id="features">
        <div className="landing-section-heading">
          <p className="landing-kicker">THE RENTFLOW WORKSPACE</p>
          <h2>Less scattered paperwork.<br /><em>More control of your portfolio.</em></h2>
          <p>Keep the essential parts of rental management connected, so you can spend less time searching through records and more time managing your properties.</p>
        </div>
        <div className="landing-feature-grid">
          {features.map((feature) => <article className="landing-feature-card" key={feature.number}>
            <span>{feature.number}</span><h3>{feature.title}</h3><p>{feature.description}</p><div className="landing-feature-arrow">↗</div>
          </article>)}
        </div>
      </section></ScrollReveal>

      <ScrollReveal><section className="landing-how" id="how-it-works">
        <div><p className="landing-kicker">A CLEARER WAY TO WORK</p><h2>Start with the basics.<br /><em>Build as you grow.</em></h2></div>
        <div className="landing-steps">
          <div><b>1</b><section><strong>Create your workspace</strong><p>Set up your account and organise your rental business.</p></section></div>
          <div><b>2</b><section><strong>Add properties, units and tenants</strong><p>Bring your portfolio records into one place and create leases.</p></section></div>
          <div><b>3</b><section><strong>Manage rent and reporting</strong><p>Generate charges, record payments, track expenses and review statements.</p></section></div>
        </div>
      </section></ScrollReveal>

      <PricingSection plans={plans ?? []} />



      <footer className="landing-footer">
        <Link href="/" className="landing-brand"><span className="brand-mark">R</span><span>rentflow</span></Link>
        <p>Clearer rental operations for property businesses.</p>
        <div><Link href="/login">Sign in</Link><Link href="/signup">Get started</Link></div>
        <small>© 2026 RentFlow. All rights reserved.</small>
      </footer>
    </main>
  );
}
