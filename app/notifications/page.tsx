import Link from "next/link";
import { WorkspaceLayout } from "@/components/workspace-layout";
import { getWorkspaceContext } from "@/lib/rentflow/context";
import { markNotificationRead } from "@/app/actions/portfolio";

export default async function NotificationsPage({searchParams}:{searchParams:Promise<{error?:string}>}) {
  const {supabase,organization,userId}=await getWorkspaceContext();
  const [{data:notifications},{count:unreadCount},params]=await Promise.all([
    supabase.from("notifications").select("id,title,message,notification_type,read_at,created_at,rent_charge_id").eq("organization_id",organization.id).eq("user_id",userId).order("created_at",{ascending:false}).limit(100),
    supabase.from("notifications").select("id",{count:"exact",head:true}).eq("organization_id",organization.id).eq("user_id",userId).is("read_at",null),
    searchParams
  ]);
  return <WorkspaceLayout workspaceName={organization.name}>
    <div className="page-heading"><div><p className="eyebrow">WORKSPACE UPDATES</p><h1>Notifications</h1><p className="muted">Automated rent reminders for your property team.</p></div><span className="status-pill">{unreadCount??0} unread</span></div>
    {params.error&&<p className="error-message">{params.error}</p>}
    <section className="panel notification-intro"><strong>Daily rent reminders are active</strong><p>RentFlow checks outstanding rent balances every day at 7:00 a.m. Kampala time and creates reminders 3 days before the due date, on the due date, and 1 and 7 days after it.</p><small>These are in-app notifications for workspace members. Email, SMS and WhatsApp delivery are not enabled yet.</small></section>
    <section className="panel table-panel"><div className="section-heading"><h2>Recent activity</h2><span>{notifications?.length??0} notifications</span></div>
      {!notifications?.length?<p className="empty-state">No notifications yet. New reminders will appear here when rent charges reach a reminder date.</p>:
      <div className="notification-list">{notifications.map(n=><article className={"notification-item "+(n.read_at?"is-read":"")} key={n.id}>
        <div className="notification-dot" aria-hidden="true"></div><div className="notification-copy"><div className="notification-title-row"><strong>{n.title}</strong><time>{new Date(n.created_at).toLocaleString("en-UG",{timeZone:"Africa/Kampala",dateStyle:"medium",timeStyle:"short"})}</time></div><p>{n.message}</p><div className="notification-actions">{n.rent_charge_id&&<Link href="/rent">Open rent ledger</Link>}{!n.read_at&&<form action={markNotificationRead}><input type="hidden" name="notification_id" value={n.id}/><button type="submit" className="button-secondary">Mark as read</button></form>}</div></div>
      </article>)}</div>}
    </section>
  </WorkspaceLayout>;
}