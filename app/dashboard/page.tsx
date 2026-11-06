import { getWorkspaceContext } from "@/lib/rentflow/context";
import { WorkspaceLayout } from "@/components/workspace-layout";
export default async function DashboardPage() {
 const {supabase,organization}=await getWorkspaceContext();
 const start=new Date(Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth(),1)).toISOString().slice(0,10);
 const [{count:propertyCount},{count:unitCount},{count:tenantCount},{data:charges},{data:payments},{data:expensesList}]=await Promise.all([
  supabase.from("properties").select("*",{count:"exact",head:true}).eq("organization_id",organization.id).is("archived_at",null),
  supabase.from("units").select("*",{count:"exact",head:true}).eq("organization_id",organization.id),
  supabase.from("tenants").select("*",{count:"exact",head:true}).eq("organization_id",organization.id),
  supabase.from("rent_charge_balances").select("balance_minor,status").eq("organization_id",organization.id),
  supabase.from("payments").select("amount_minor,received_at,status").eq("organization_id",organization.id).gte("received_at",start),
  supabase.from("expenses").select("amount_minor").eq("organization_id",organization.id).gte("incurred_on",start)
 ]);
 const collected=(payments??[]).filter(p=>p.status==="posted").reduce((s,p)=>s+Number(p.amount_minor),0);
 const outstanding=(charges??[]).filter(c=>c.status!=="paid"&&c.status!=="void").reduce((s,c)=>s+Number(c.balance_minor),0);
 const expenseTotal=(expensesList??[]).reduce((s,e)=>s+Number(e.amount_minor),0);
 return <WorkspaceLayout workspaceName={organization.name}><div className="page-heading"><div><p className="eyebrow">RENTAL OPERATIONS</p><h1>Portfolio overview</h1><p className="muted">A live summary of your properties, tenants and rental finances.</p></div></div>
 <div className="metric-grid"><article className="metric-card"><p>Properties</p><strong>{propertyCount??0}</strong><small>Active property records</small></article><article className="metric-card"><p>Rental units</p><strong>{unitCount??0}</strong><small>Across your portfolio</small></article><article className="metric-card"><p>Tenants</p><strong>{tenantCount??0}</strong><small>Registered tenant records</small></article><article className="metric-card"><p>Rent collected this month</p><strong>UGX {collected.toLocaleString("en-UG")}</strong><small>Posted payments received</small></article><article className="metric-card"><p>Outstanding charges</p><strong>UGX {outstanding.toLocaleString("en-UG")}</strong><small>Charge totals; verify allocations in the rent ledger</small></article><article className="metric-card"><p>Expenses this month</p><strong>UGX {expenseTotal.toLocaleString("en-UG")}</strong><small>Recorded expenses</small></article></div>
 <section className="panel dashboard-callout"><h2>Continue setting up your portfolio</h2><p>Register properties and units, add tenants and create leases. Once leases are active, generate rent charges and record payments.</p><div className="quick-links"><a href="/properties">Add properties</a><a href="/tenants">Register tenants</a><a href="/leases">Create leases</a><a href="/rent">Open rent ledger</a></div></section></WorkspaceLayout>;
}