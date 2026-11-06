"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "@/app/actions/auth";

const links=[["/dashboard","Overview"],["/properties","Properties & units"],["/owners","Property owners"],["/tenants","Tenants"],["/leases","Leases"],["/rent","Rent ledger"],["/notifications","Notifications"],["/expenses","Expenses"],["/maintenance","Maintenance"],["/reports","Reports"],["/intelligence","Portfolio insights"],["/team","Team members"],["/subscription","Subscription"]];
export function WorkspaceLayout({children,workspaceName}:{children:React.ReactNode;workspaceName:string}) {
 const [collapsed,setCollapsed]=useState(false);
 return <main className={`workspace-shell ${collapsed?"sidebar-collapsed":""}`}>
  <aside className="workspace-sidebar">
   <div className="sidebar-brand-row"><Link className="brand" href="/dashboard"><span className="brand-mark">R</span><span className="sidebar-brand-name">rentflow</span></Link><button type="button" className="sidebar-toggle" aria-label={collapsed?"Expand sidebar":"Collapse sidebar"} aria-expanded={!collapsed} onClick={()=>setCollapsed(v=>!v)}>{collapsed?"›":"‹"}</button></div>
   <p className="nav-caption">WORKSPACE</p>
   <nav aria-label="Workspace navigation">{links.map(([href,label])=><Link className="nav-link" href={href} key={href} title={collapsed?label:undefined}><span className="nav-link-icon">{label.slice(0,1)}</span><span className="nav-link-label">{label}</span></Link>)}</nav>
   <div className="sidebar-bottom"><div className="workspace-avatar">RF</div><div className="sidebar-workspace-copy"><strong>{workspaceName}</strong><small>Rental workspace</small></div></div>
  </aside>
  <section className="workspace-main"><header className="workspace-topbar"><span>{workspaceName} <span className="slash">/</span> RentFlow</span><form action={signOut}><button className="signout-button">Sign out</button></form></header><div className="workspace-content">{children}</div></section>
 </main>;
}
