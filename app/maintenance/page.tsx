import { createMaintenanceRequest, updateMaintenanceStatus, recordMaintenanceCostAndDeduction } from "@/app/actions/portfolio";
import { getWorkspaceContext } from "@/lib/rentflow/context";
import { WorkspaceLayout } from "@/components/workspace-layout";
import { SearchableSelect } from "@/components/searchable-select";

const priorities=["low","normal","high","urgent"];
const statuses=["open","in_progress","waiting","completed","cancelled"];

export default async function MaintenancePage({searchParams}:{searchParams:Promise<{error?:string;success?:string}>}) {
 const {supabase,organization}=await getWorkspaceContext();
 const [{data:properties},{data:units},{data:requests},{data:leases},{data:tenants},params]=await Promise.all([
  supabase.from("properties").select("id,name").eq("organization_id",organization.id).is("archived_at",null).order("name"),
  supabase.from("units").select("id,property_id,unit_code").eq("organization_id",organization.id).order("unit_code"),
  supabase.from("maintenance_requests").select("*").eq("organization_id",organization.id).order("reported_at",{ascending:false}).limit(100),
  supabase.from("leases").select("id,unit_id,tenant_id,lease_reference,start_date,end_date,deposit_amount_minor").eq("organization_id",organization.id),
  supabase.from("tenants").select("id,full_name").eq("organization_id",organization.id),
  searchParams
 ]);
 return <WorkspaceLayout workspaceName={organization.name}>
  <div className="page-heading"><div><p className="eyebrow">OPERATIONS</p><h1>Maintenance</h1><p className="muted">Log repairs, prioritise work and track maintenance through completion.</p></div></div>
  {params.error&&<p className="error-message">{params.error}</p>}{params.success&&<p className="success-message">{params.success}</p>}
  <section className="panel"><h2>Log a maintenance request</h2><form action={createMaintenanceRequest} className="data-form"><div className="form-grid">
   <SearchableSelect name="property_id" label="Property" required options={(properties??[]).map(p=>({value:p.id,label:p.name}))}/>
   <SearchableSelect name="unit_id" label="Unit (optional)" options={[{value:"",label:"Property-wide"},...(units??[]).map(u=>({value:u.id,label:(properties?.find(p=>p.id===u.property_id)?.name??"Property")+" · "+u.unit_code}))]}/>
   <label>Issue title<input name="title" required minLength={3} maxLength={160} placeholder="e.g. Leaking kitchen tap"/></label>
   <label>Category<select name="category"><option value="general">General</option><option value="plumbing">Plumbing</option><option value="electrical">Electrical</option><option value="structural">Structural</option><option value="appliance">Appliance</option><option value="cleaning">Cleaning</option><option value="security">Security</option></select></label>
   <label>Priority<select name="priority" defaultValue="normal">{priorities.map(p=><option key={p} value={p}>{p.replace("_"," ")}</option>)}</select></label>
   <label>Target date<input name="due_date" type="date"/></label>
   <label className="form-span">Description<textarea name="description" rows={3} placeholder="Describe the problem, access requirements and any useful details."/></label>
  </div><button disabled={!properties?.length}>Create request</button></form></section>
  <section className="panel table-panel"><div className="section-heading"><h2>Maintenance register</h2><span>{requests?.length??0} recent requests</span></div>
   {!requests?.length?<p className="empty-state">No maintenance requests yet.</p>:<div className="table-wrap"><table><thead><tr><th>Reported</th><th>Issue</th><th>Property / unit</th><th>Priority</th><th>Status</th><th>Target date</th><th>Cost / deposit deduction</th><th>Update</th></tr></thead><tbody>{requests.map(r=><tr key={r.id}>
    <td>{new Date(r.reported_at).toLocaleDateString("en-UG")}</td><td><strong>{r.title}</strong><br/><small>{r.description??r.category}</small></td>
    <td>{properties?.find(p=>p.id===r.property_id)?.name??"Property"}<br/><small>{units?.find(u=>u.id===r.unit_id)?.unit_code??"Whole property"}</small></td>
    <td><span className="status-pill">{r.priority}</span></td><td><span className="status-pill">{r.status.replace("_"," ")}</span></td><td>{r.due_date??"—"}</td>
    <td><form action={recordMaintenanceCostAndDeduction} className="data-form maintenance-cost-form"><input type="hidden" name="request_id" value={r.id}/><label>Actual repair cost (UGX)<input name="maintenance_cost_minor" type="number" min="0" step="1" defaultValue={r.maintenance_cost_minor??0} required/></label><label className="checkbox-label"><input type="checkbox" name="tenant_damage" defaultChecked={r.tenant_damage??false}/> Tenant-caused damage</label><label>Deposit deduction (UGX)<input name="deposit_deduction_minor" type="number" min="0" step="1" defaultValue={r.deposit_deduction_minor??0}/></label><label>Responsible lease<select name="responsible_lease_id" defaultValue={r.responsible_lease_id??""}><option value="">Select lease for this unit</option>{(leases??[]).filter(l=>l.unit_id===r.unit_id&&l.start_date<=r.reported_at.slice(0,10)&&(!l.end_date||l.end_date>=r.reported_at.slice(0,10))).map(l=><option key={l.id} value={l.id}>{tenants?.find(t=>t.id===l.tenant_id)?.full_name??"Tenant"} · {l.lease_reference??l.id.slice(0,8)}</option>)}</select></label><label>Damage explanation<input name="deduction_description" placeholder="Describe damage and evidence"/></label><button type="submit" className="button-secondary">Save cost / deduction</button></form>{r.deposit_deduction_minor>0&&<small>Previously deducted: UGX {Number(r.deposit_deduction_minor).toLocaleString("en-UG")}</small>}</td>
    <td><form action={updateMaintenanceStatus} className="inline-form"><input type="hidden" name="request_id" value={r.id}/><select name="status" defaultValue={r.status}>{statuses.map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}</select><button type="submit" className="button-secondary">Save</button></form></td>
   </tr>)}</tbody></table></div>}
  </section>
 </WorkspaceLayout>;
}
