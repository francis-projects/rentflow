import { createTenant, uploadTenantDocument, deleteTenantDocument } from "@/app/actions/portfolio";
import { getWorkspaceContext } from "@/lib/rentflow/context";
import { WorkspaceLayout } from "@/components/workspace-layout";
import { SearchableSelect } from "@/components/searchable-select";

export default async function TenantsPage({searchParams}:{searchParams:Promise<{error?:string;success?:string}>}) {
 const {supabase,organization}=await getWorkspaceContext();
 const [{data:tenants},{data:documents},params]=await Promise.all([
  supabase.from("tenants").select("*").eq("organization_id",organization.id).order("full_name"),
  supabase.from("tenant_documents").select("*").eq("organization_id",organization.id).order("uploaded_at",{ascending:false}),
  searchParams
 ]);
 const files=await Promise.all((documents??[]).map(async doc=>{
  const {data}=await supabase.storage.from("tenant-documents").createSignedUrl(doc.storage_path,300);
  return {...doc,signedUrl:data?.signedUrl??null};
 }));
 return <WorkspaceLayout workspaceName={organization.name}><div className="page-heading"><div><p className="eyebrow">PEOPLE</p><h1>Tenants</h1><p className="muted">Tenant contacts, emergency contacts and securely stored tenant documents.</p></div></div>
 {params.error&&<p className="error-message">{params.error}</p>}{params.success&&<p className="success-message">{params.success}</p>}
 <section className="panel"><h2>Register a tenant</h2><form action={createTenant} className="data-form"><div className="form-grid"><label>Full name<input name="full_name" required/></label><label>Email<input name="email" type="email"/></label><label>Phone<input name="phone" type="tel"/></label><label>Emergency contact name<input name="emergency_contact_name"/></label><label>Emergency contact phone<input name="emergency_contact_phone" type="tel"/></label></div><label>Notes<textarea name="notes" rows={2}/></label><button>Add tenant</button></form></section>
 <section className="panel"><h2>Upload tenant document</h2><p className="muted">Private storage. PDF, JPG and PNG files up to 10 MB. Links expire after five minutes.</p><form action={uploadTenantDocument} className="data-form"><div className="form-grid"><SearchableSelect name="tenant_id" label="Tenant" required options={(tenants??[]).map(t=>({value:t.id,label:t.full_name}))}/><label>Document type<select name="document_type"><option value="tenancy_agreement">Tenancy agreement</option><option value="identification">Identification</option><option value="inventory">Inventory / inspection</option><option value="notice">Notice / correspondence</option><option value="other">Other</option></select></label><label>Choose file<input name="document" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required/></label><label>Notes<input name="notes"/></label></div><button disabled={!tenants?.length}>Upload securely</button></form></section>
 <section className="panel table-panel"><div className="section-heading"><h2>Tenant documents</h2><span>{files.length} files</span></div>{!files.length?<p className="empty-state">No tenant documents uploaded yet.</p>:<div className="table-wrap"><table><thead><tr><th>Tenant</th><th>Document</th><th>Type</th><th>Uploaded</th><th>Size</th><th>Actions</th></tr></thead><tbody>{files.map(doc=><tr key={doc.id}><td>{tenants?.find(t=>t.id===doc.tenant_id)?.full_name??"Tenant"}</td><td><strong>{doc.file_name}</strong></td><td>{doc.document_type.replaceAll("_"," ")}</td><td>{new Date(doc.uploaded_at).toLocaleDateString("en-UG")}</td><td>{(doc.size_bytes/1024).toFixed(0)} KB</td><td>{doc.signedUrl?<a href={doc.signedUrl} target="_blank" rel="noreferrer">Open file</a>:"Unavailable"} <form action={deleteTenantDocument} className="inline-form"><input type="hidden" name="document_id" value={doc.id}/><button type="submit" className="button-secondary">Delete</button></form></td></tr>)}</tbody></table></div>}</section>
 <section className="panel table-panel"><div className="section-heading"><h2>Tenant directory</h2><span>{tenants?.length??0} tenants</span></div>{!tenants?.length?<p className="empty-state">No tenants registered yet.</p>:<div className="table-wrap"><table><thead><tr><th>Tenant</th><th>Email</th><th>Phone</th><th>Emergency contact</th></tr></thead><tbody>{tenants.map(t=><tr key={t.id}><td><strong>{t.full_name}</strong></td><td>{t.email??"—"}</td><td>{t.phone??"—"}</td><td>{[t.emergency_contact_name,t.emergency_contact_phone].filter(Boolean).join(" · ")||"—"}</td></tr>)}</tbody></table></div>}</section></WorkspaceLayout>;
}
