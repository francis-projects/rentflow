import { getWorkspaceContext } from "@/lib/rentflow/context";
import { WorkspaceLayout } from "@/components/workspace-layout";
import { updateOrganisationMemberRole, removeOrganisationMember } from "@/app/actions/portfolio";

const roleLabels: Record<string,string> = {
 owner:"Owner",admin:"Administrator",manager:"Property manager",accountant:"Accountant",staff:"Staff"
};

export default async function TeamPage({searchParams}:{searchParams:Promise<{error?:string;success?:string}>}) {
 const {supabase,organization,membership,userId}=await getWorkspaceContext();
 const [{data:members},params]=await Promise.all([
  supabase.from("organization_members").select("id,user_id,role,created_at").eq("organization_id",organization.id).order("created_at"),
  searchParams
 ]);
 const canManage=membership.role==="owner"||membership.role==="admin";
 return <WorkspaceLayout workspaceName={organization.name}>
  <div className="page-heading"><div><p className="eyebrow">WORKSPACE ACCESS</p><h1>Team members</h1><p className="muted">Manage who can access this rental workspace and the level of access they have.</p></div></div>
  {params.error&&<p className="error-message">{params.error}</p>}{params.success&&<p className="success-message">{params.success}</p>}
  <section className="panel">
   <div className="section-heading"><h2>Members and permissions</h2><span>{members?.length??0} members</span></div>
   <p className="muted">Owners and administrators can manage team roles. The owner role is protected, and every workspace must retain at least one owner.</p>
   {!members?.length?<p className="empty-state">No team members found.</p>:<div className="table-wrap"><table><thead><tr><th>Account ID</th><th>Role</th><th>Joined</th>{canManage&&<th>Actions</th>}</tr></thead><tbody>{members.map(member=><tr key={member.id}>
    <td><strong>{member.user_id===userId?"You":member.user_id.slice(0,8)+"…"+member.user_id.slice(-4)}</strong><small className="muted">{member.user_id===userId?"Signed-in account": "User ID"}</small></td>
    <td>{roleLabels[member.role]??member.role}</td><td>{new Date(member.created_at).toLocaleDateString("en-UG")}</td>
    {canManage&&<td>{member.role==="owner"&&membership.role!=="owner"?<span className="muted">Owner protected</span>:<div className="inline-actions">
      {member.role!=="owner"&&<form action={updateOrganisationMemberRole} className="inline-form"><input type="hidden" name="member_id" value={member.id}/><select name="role" defaultValue={member.role} aria-label="Member role"><option value="admin">Administrator</option><option value="manager">Property manager</option><option value="accountant">Accountant</option><option value="staff">Staff</option></select><button className="button-secondary">Save role</button></form>}
      {member.user_id!==userId&&member.role!=="owner"&&<form action={removeOrganisationMember}><input type="hidden" name="member_id" value={member.id}/><button className="button-secondary" formAction={removeOrganisationMember}>Remove</button></form>}
     </div>}</td>}
   </tr>)}</tbody></table></div>}
  </section>
  <section className="panel"><h2>Role permissions</h2><div className="table-wrap"><table><thead><tr><th>Role</th><th>Access summary</th></tr></thead><tbody>
   <tr><td><strong>Owner</strong></td><td>Full workspace control, including team administration.</td></tr>
   <tr><td><strong>Administrator</strong></td><td>Manage workspace operations and non-owner team roles.</td></tr>
   <tr><td><strong>Property manager</strong></td><td>Manage properties, tenants, leases, maintenance and operational records.</td></tr>
   <tr><td><strong>Accountant</strong></td><td>Access financial workflows permitted by the finance policies.</td></tr>
   <tr><td><strong>Staff</strong></td><td>Operational access according to the workspace policies.</td></tr>
  </tbody></table></div></section>
  <section className="panel"><h2>Inviting new people</h2><p className="muted">Role management for existing workspace members is available here. Email invitations are not yet enabled; they require a secure Auth Admin integration so invitation emails can be sent without exposing privileged credentials in the browser.</p></section>
 </WorkspaceLayout>;
}
