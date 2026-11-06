import { createOwner, assignPropertyOwner } from "@/app/actions/portfolio";
import { getWorkspaceContext } from "@/lib/rentflow/context";
import { WorkspaceLayout } from "@/components/workspace-layout";

const money = (value: number) => "UGX " + Number(value).toLocaleString("en-UG");

export default async function OwnersPage({searchParams}:{searchParams:Promise<{error?:string;success?:string}>}) {
 const {supabase,organization}=await getWorkspaceContext();
 const [{data:owners},{data:properties},{data:links},{data:statements},params]=await Promise.all([
  supabase.from("owners").select("*").eq("organization_id",organization.id).order("full_name"),
  supabase.from("properties").select("id,name").eq("organization_id",organization.id).is("archived_at",null),
  supabase.from("property_owners").select("*").eq("organization_id",organization.id),
  supabase.from("owner_monthly_statements").select("*").eq("organization_id",organization.id).order("statement_month",{ascending:false}).limit(100),
  searchParams
 ]);
 return <WorkspaceLayout workspaceName={organization.name}>
  <div className="page-heading"><div><p className="eyebrow">PEOPLE</p><h1>Property owners</h1><p className="muted">Manage ownership, contact records and monthly owner financial statements.</p></div></div>
  {params.error&&<p className="error-message">{params.error}</p>}{params.success&&<p className="success-message">{params.success}</p>}
  <section className="panel"><h2>Add property owner</h2><form action={createOwner} className="data-form form-grid"><label>Full name<input name="full_name" required/></label><label>Email<input name="email" type="email"/></label><label>Phone<input name="phone" type="tel"/></label><label>Postal address<input name="postal_address"/></label><div><button>Add owner</button></div></form></section>
  <section className="panel"><h2>Assign an owner to a property</h2><form action={assignPropertyOwner} className="data-form form-grid"><label>Property<select name="property_id" required defaultValue=""><option value="" disabled>Select property</option>{properties?.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Owner<select name="owner_id" required defaultValue=""><option value="" disabled>Select owner</option>{owners?.map(o=><option key={o.id} value={o.id}>{o.full_name}</option>)}</select></label><label>Ownership percentage<input name="ownership_percent" type="number" min="0.01" max="100" step="0.01" required/></label><div><button disabled={!properties?.length||!owners?.length}>Save ownership</button></div></form><small>Combined ownership shares are enforced by the database and cannot exceed 100% per property.</small></section>
  <section className="panel table-panel"><div className="section-heading"><h2>Monthly owner statements</h2><span>{statements?.length??0} statement lines</span></div><p className="muted">Cash-basis figures use posted rent payments allocated to rent charges and recorded property expenses. Unallocated payments are excluded until reconciled.</p>{!statements?.length?<p className="empty-state">Owner statements will appear after rent payments are allocated and property expenses are recorded.</p>:<div className="table-wrap"><table><thead><tr><th>Month</th><th>Owner</th><th>Property</th><th>Share</th><th>Rent share</th><th>Expense share</th><th>Net</th></tr></thead><tbody>{statements.map((s:any)=><tr key={s.owner_id+"-"+s.property_id+"-"+s.statement_month}><td>{new Date(s.statement_month+"T00:00:00").toLocaleDateString("en-UG",{month:"short",year:"numeric"})}</td><td><strong>{s.owner_name}</strong></td><td>{s.property_name}</td><td>{Number(s.ownership_percent).toFixed(2)}%</td><td>{money(s.owner_rent_share_minor)}</td><td>{money(s.owner_expense_share_minor)}</td><td><strong>{money(s.owner_net_minor)}</strong></td></tr>)}</tbody></table></div>}</section>
  <section className="panel table-panel"><div className="section-heading"><h2>Property ownership register</h2><span>{links?.length??0} allocations</span></div><div className="table-wrap"><table><thead><tr><th>Property</th><th>Owner</th><th>Share</th></tr></thead><tbody>{links?.map(link=><tr key={link.id}><td>{properties?.find(p=>p.id===link.property_id)?.name??"—"}</td><td>{owners?.find(o=>o.id===link.owner_id)?.full_name??"—"}</td><td>{Number(link.ownership_percent).toFixed(2)}%</td></tr>)}</tbody></table></div></section>
  <section className="panel table-panel"><div className="section-heading"><h2>Owner directory</h2><span>{owners?.length??0} records</span></div>{!owners?.length?<p className="empty-state">No owners added yet.</p>:<div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th></tr></thead><tbody>{owners.map(o=><tr key={o.id}><td><strong>{o.full_name}</strong></td><td>{o.email??"—"}</td><td>{o.phone??"—"}</td><td>{o.postal_address??"—"}</td></tr>)}</tbody></table></div>}</section>
 </WorkspaceLayout>;
}
