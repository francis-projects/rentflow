import { getWorkspaceContext } from "@/lib/rentflow/context";
import { WorkspaceLayout } from "@/components/workspace-layout";
export default async function ReportsPage(){
 const {supabase,organization}=await getWorkspaceContext();
 const [{data:charges},{data:balances},{data:payments},{data:expensesList},{data:properties},{data:units},{data:leases},{data:tenants}]=await Promise.all([
  supabase.from("rent_charges").select("*").eq("organization_id",organization.id).order("due_date",{ascending:false}),\n  supabase.from("rent_charge_balances").select("balance_minor,status").eq("organization_id",organization.id),
  supabase.from("payments").select("*").eq("organization_id",organization.id).eq("status","posted").order("received_at",{ascending:false}),
  supabase.from("expenses").select("*").eq("organization_id",organization.id).eq("status","recorded").order("incurred_on",{ascending:false}),
  supabase.from("properties").select("id,name").eq("organization_id",organization.id).is("archived_at",null),
  supabase.from("units").select("id,property_id,status").eq("organization_id",organization.id),
  supabase.from("leases").select("id,tenant_id,unit_id,status").eq("organization_id",organization.id),
  supabase.from("tenants").select("id,full_name").eq("organization_id",organization.id)
 ]);
 const totalCharged=(charges??[]).filter(c=>c.status!=="void").reduce((s,c)=>s+Number(c.amount_minor),0);
 const totalCollected=(payments??[]).reduce((s,p)=>s+Number(p.amount_minor),0);
 const totalExpenses=(expensesList??[]).reduce((s,e)=>s+Number(e.amount_minor),0);
 const occupancy=(units?.length??0)>0?Math.round((units??[]).filter(u=>u.status==="occupied").length/(units?.length??1)*100):0;
 const unpaid=(balances??[]).filter(c=>c.status!=="void").reduce((s,c)=>s+Number(c.balance_minor??0),0);
 return <WorkspaceLayout workspaceName={organization.name}><div className="page-heading"><div><p className="eyebrow">INSIGHTS</p><h1>Reports</h1><p className="muted">Portfolio and financial summaries based on recorded data.</p></div></div>
 <div className="metric-grid"><article className="metric-card"><p>Total rent charged</p><strong>UGX {totalCharged.toLocaleString("en-UG")}</strong><small>All non-void rent charges</small></article><article className="metric-card"><p>Payments received</p><strong>UGX {totalCollected.toLocaleString("en-UG")}</strong><small>All posted payments</small></article><article className="metric-card"><p>Outstanding charges</p><strong>UGX {unpaid.toLocaleString("en-UG")}</strong><small>Outstanding balance after posted payment allocations</small></article><article className="metric-card"><p>Recorded expenses</p><strong>UGX {totalExpenses.toLocaleString("en-UG")}</strong><small>All recorded expenses</small></article><article className="metric-card"><p>Occupancy</p><strong>{occupancy}%</strong><small>{(units??[]).filter(u=>u.status==="occupied").length} occupied of {units?.length??0} units</small></article><article className="metric-card"><p>Active leases</p><strong>{(leases??[]).filter(l=>l.status==="active").length}</strong><small>{tenants?.length??0} registered tenants</small></article></div>
 <section className="panel table-panel"><div className="section-heading"><h2>Property portfolio</h2><span>{properties?.length??0} properties</span></div><div className="table-wrap"><table><thead><tr><th>Property</th><th>Total units</th><th>Occupied</th><th>Vacant</th></tr></thead><tbody>{properties?.map(p=>{const rows=(units??[]).filter(u=>u.property_id===p.id);return <tr key={p.id}><td><strong>{p.name}</strong></td><td>{rows.length}</td><td>{rows.filter(u=>u.status==="occupied").length}</td><td>{rows.filter(u=>u.status==="vacant").length}</td></tr>})}</tbody></table></div></section>
 <section className="panel table-panel"><div className="section-heading"><h2>Recent payments</h2><span>Latest 10</span></div><div className="table-wrap"><table><thead><tr><th>Date</th><th>Tenant</th><th>Method</th><th>Reference</th><th>Amount</th></tr></thead><tbody>{payments?.slice(0,10).map(p=><tr key={p.id}><td>{new Date(p.received_at).toLocaleDateString("en-UG")}</td><td>{tenants?.find(t=>t.id===p.tenant_id)?.full_name??"—"}</td><td>{p.payment_method}</td><td>{p.payment_reference??"—"}</td><td>{Number(p.amount_minor).toLocaleString("en-UG")}</td></tr>)}</tbody></table></div></section>
 </WorkspaceLayout>;
}