import Link from "next/link";
import { signOut } from "@/app/actions/auth";

const links=[["/dashboard","Overview"],["/properties","Properties & units"],["/owners","Property owners"],["/tenants","Tenants"],["/leases","Leases"],["/rent","Rent ledger"],["/expenses","Expenses"],["/reports","Reports"]];
export function WorkspaceLayout({children,workspaceName}:{children:React.ReactNode;workspaceName:string}) {
 return <main className="workspace-shell">
  <aside className="workspace-sidebar">
   <Link className="brand" href="/dashboard"><span className="brand-mark">R</span>rentflow</Link>
   <p className="nav-caption">WORKSPACE</p>
   <nav>{links.map(([href,label])=><Link className="nav-link" href={href} key={href}>{label}</Link>)}</nav>
   <div className="sidebar-bottom"><div className="workspace-avatar">RF</div><div><strong>{workspaceName}</strong><small>Rental workspace</small></div></div>
  </aside>
  <section className="workspace-main"><header className="workspace-topbar"><span>{workspaceName} <span className="slash">/</span> RentFlow</span><form action={signOut}><button className="signout-button">Sign out</button></form></header><div className="workspace-content">{children}</div></section>
 </main>;
}
