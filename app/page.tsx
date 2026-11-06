const metrics = [
  ["Properties", "—", "Your managed portfolio"],
  ["Rental units", "—", "Occupied and vacant"],
  ["Rent collected", "UGX —", "Current month"],
  ["Outstanding rent", "UGX —", "Open balances"]
];
const tasks = [
  ["01", "Property register", "Add buildings and rental units"],
  ["02", "Tenant and lease records", "Keep tenant and agreement details together"],
  ["03", "Rent ledger", "Track charges, payments and balances"]
];
export default function Home() {
  return <main className="shell">
    <aside className="sidebar">
      <a className="brand" href="/"><span className="brand-mark">R</span>rentflow</a>
      <p className="nav-caption">WORKSPACE</p>
      <nav aria-label="Main navigation">
        {["Overview", "Properties", "Tenants", "Leases", "Rent ledger", "Expenses", "Reports"].map((item, i) =>
          <a className={i === 0 ? "nav-link active" : "nav-link"} href={i === 0 ? "/" : "#"+item.toLowerCase().replaceAll(" ","-")} key={item}>{item}</a>)}
      </nav>
      <div className="sidebar-bottom"><div className="workspace-avatar">RF</div><div><strong>Your workspace</strong><small>Setup in progress</small></div></div>
    </aside>
    <section className="main-panel">
      <header className="topbar"><span>Workspace <span className="slash">/</span> Overview</span><div className="profile"><i /> Development preview <b>U</b></div></header>
      <div className="content">
        <div className="welcome-row"><div><p className="eyebrow">RENTAL OPERATIONS</p><h1>Good day. Here’s your overview.</h1><p className="muted">Your rental portfolio, rent collection and outstanding balances — all in one place.</p></div><button disabled>＋ Add property</button></div>
        <div className="notice"><strong>Your RentFlow workspace is being prepared</strong><p>This is the initial interface foundation. Connect Supabase and complete secure workspace setup before entering real records.</p></div>
        <section className="metric-grid">{metrics.map(([label,value,note])=><article className="metric-card" key={label}><p>{label}</p><strong>{value}</strong><small>{note}</small></article>)}</section>
        <section className="section-block"><div className="section-heading"><div><p className="eyebrow">GETTING STARTED</p><h2>Build your rental workspace</h2></div><span>Step 1 of 5</span></div>
          <div className="activity-list">{tasks.map(([number,title,detail])=><article className="activity-row" key={number}><span className="activity-number">{number}</span><div><strong>{title}</strong><p>{detail}</p></div><small>Coming next</small></article>)}</div>
        </section>
        <footer>RentFlow · Independent rental management software</footer>
      </div>
    </section>
  </main>;
}