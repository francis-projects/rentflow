import { createOwner } from "@/app/actions/portfolio";
import { getWorkspaceContext } from "@/lib/rentflow/context";
import { WorkspaceLayout } from "@/components/workspace-layout";
export default async function OwnersPage({searchParams}:{searchParams:Promise<{error?:string;success?:string}>}) {
 const {supabase,organization}=await getWorkspaceContext(); const [{data:owners},params]=await Promise.all([supabase.from("owners").select("*").eq("organization_id",organization.id).order("full_name"),searchParams]);
 return <WorkspaceLayout workspaceName={organization.name}><div className="page-heading"><div><p className="eyebrow">PEOPLE</p><h1>Property owners</h1><p className="muted">Keep ownership and contact records for managed properties.</p></div></div>
 {params.error&&<p className="error-message">{params.error}</p>}{params.success&&<p className="success-message">{params.success}</p>}
 <section className="panel"><h2>Add property owner</h2><form action={createOwner} className="data-form form-grid"><label>Full name<input name="full_name" required/></label><label>Email<input name="email" type="email"/></label><label>Phone<input name="phone" type="tel"/></label><label>Postal address<input name="postal_address"/></label><div><button>Add owner</button></div></form></section>
 <section className="panel table-panel"><div className="section-heading"><h2>Owner directory</h2><span>{owners?.length??0} records</span></div>{!owners?.length?<p className="empty-state">No owners added yet.</p>:<div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th></tr></thead><tbody>{owners.map(o=><tr key={o.id}><td><strong>{o.full_name}</strong></td><td>{o.email??"—"}</td><td>{o.phone??"—"}</td><td>{o.postal_address??"—"}</td></tr>)}</tbody></table></div>}</section></WorkspaceLayout>;
}
