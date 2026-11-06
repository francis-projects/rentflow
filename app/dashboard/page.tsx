import { getWorkspaceContext } from "@/lib/rentflow/context";
import { WorkspaceLayout } from "@/components/workspace-layout";

export default async function DashboardPage() {
 const {supabase,organization}=await getWorkspaceContext();
 const month=new Date(); const start=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth(),1)).toISOString().slice(0,10);
 const [{count:propertyCount},{count:unitCount},{count:tenantCount},{data:charges},{data:payments},{data:expensesList}] = await Promise.all([
  supabase.from("properties").select("*",{count:"exact",head:true}).eq("organization_id",organization.id).is("archived_at",null),
  supabase.from("units").select("*",{count:"exact",head:true}).eq("organization_id",organization.id),
  supabase.from("tenants").select("*",{count:"exact",head:true}).eq("organization_id",organization.id),
  supabase.from("rent_charges").select("id,amount_minor,status").eq("organization_id",organization.id),
  supabase.from("payments").select("amount_minor,received_at,status").eq("organization_id",organization.id).gte("received_at",start),
  supabase.from("expenses").select("amount_minor").eq("organization_id",organization.id).gte("incurred_on",start)
 ]);
 const collected=(payments??[]).filter(p=>p.status==="posted").reduce((sum,p)=>sum+Number(p.amount_minor),0);
 const charged=(charges??[]).filter(c=>c.status!=="void").reduce((sum,c)=>sum+Number(c.amount_minor),0);
 const paid=(charges??[]).filter(c=>c.status!=="void").reduce((sum,c)=>sum+0,0);
 const outstanding=(charges??[]).filter(c=>c.status!=="paid"&&c.status!=="void").reduce((sum,c)=>sum+Number(c.amount_minor),0);
 const expenseTotal=(expensesList??[]).reduce((sum,e)=>sum+Number(e.amount_minor),0);
 return <WorkspaceLayout workspaceName={organization.name}><div className="page-heading"><div><p className="eyebrow">RENTAL OPERATIONS</p><h1>Portfolio overview</h1><p className="muted">A live summary of your properties, tenants and rental finances.</p></div></div>
 <div className="metric-grid"><article className="metric-card"><p>Properties</p><strong>{propertyCount??0}</strong><small>Active property records</small></article><article className="metric-card"><p>Rental units</p><strong>{unitCount??0}</strong><small>Across your portfolio</small></article><article className="metric-card"><p>Tenants</p><strong>{tenantCount??0}</strong><small>Registered tenant records</small></article><article className="metric-card"><p>Rent collected this month</p><strong>UGX {collected.toLocaleString("en-UG")}</strong><small>Posted payments received</small></article><article className="metric-card"><p>Outstanding charges</p><strong>UGX {outstanding.toLocaleString("en-UG")}</strong><small>Unpaid charge face value; see ledger for allocations</small></article><article className="metric-card"><p>Expenses this month</p><strong>UGX {expenseTotal.toLocaleString("en-UG")}</strong><small>Recorded expenses</small></article></div>
 <section className="panel dashboard-callout"><h2>Continue setting up your portfolio</h2><p>Start by registering your properties and units, then add tenants and create leases. Once leases are active, generate rent charges and record payments.</p><div className="quick-links"><a href="/properties">Add properties</a><a href="/tenants">Register tenants</a><a href="/leases">Create leases</a><a href="/rent">Open rent ledger</a></div></section>
 </WorkspaceLayout>;
}
