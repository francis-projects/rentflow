import Link from "next/link";

const features = [
  { number: "01", title: "Property & unit records", description: "Keep property details, rental units and occupancy information organised in one workspace." },
  { number: "02", title: "Tenants & leases", description: "Maintain tenant records, lease terms, rent amounts and due dates together." },
  { number: "03", title: "Rent ledger & payments", description: "Generate rent charges, record full or partial payments and keep an auditable payment history." },
  { number: "04", title: "Expenses & owner reports", description: "Record property expenses, allocate portfolio costs and prepare owner statements." },
];

export default function HomePage() {
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
            <div><small>RENT COLLECTED</small><strong>UGX —</strong><span>Monitor payments</span></div>
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

      <section className="landing-section" id="features">
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
      </section>

      <section className="landing-how" id="how-it-works">
        <div><p className="landing-kicker">A CLEARER WAY TO WORK</p><h2>Start with the basics.<br /><em>Build as you grow.</em></h2></div>
        <div className="landing-steps">
          <div><b>1</b><section><strong>Create your workspace</strong><p>Set up your account and organise your rental business.</p></section></div>
          <div><b>2</b><section><strong>Add properties, units and tenants</strong><p>Bring your portfolio records into one place and create leases.</p></section></div>
          <div><b>3</b><section><strong>Manage rent and reporting</strong><p>Generate charges, record payments, track expenses and review statements.</p></section></div>
        </div>
      </section>

      <section className="landing-plans" id="plans">
        <div><p className="landing-kicker">PLANS THAT CAN GROW WITH YOU</p><h2>Start simple.<br /><em>Choose more when you need it.</em></h2><p>Explore the available workspace tiers. Paid plan pricing and billing arrangements are currently being finalised.</p></div>
        <div className="landing-plan-list">
          <div><strong>Free</strong><span>Get started with the essentials</span><b>UGX 0</b></div>
          <div><strong>Starter</strong><span>For growing rental portfolios</span><b>Contact us</b></div>
          <div><strong>Professional</strong><span>More capacity and advanced tools</span><b>Contact us</b></div>
          <div><strong>Enterprise</strong><span>For larger property operations</span><b>Contact us</b></div>
          <Link href="/signup" className="landing-primary-cta">Create your workspace <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <footer className="landing-footer">
        <Link href="/" className="landing-brand"><span className="brand-mark">R</span><span>rentflow</span></Link>
        <p>Clearer rental operations for property businesses.</p>
        <div><Link href="/login">Sign in</Link><Link href="/signup">Get started</Link></div>
        <small>© {new Date().getFullYear()} RentFlow. All rights reserved.</small>
      </footer>
    </main>
  );
}
