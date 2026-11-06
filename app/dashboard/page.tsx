import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const [{ data: membership }, { data: userData }] = await Promise.all([
    supabase.from("organization_members").select("organization_id, role").eq("user_id", userId).limit(1).maybeSingle(),
    supabase.auth.getUser(),
  ]);

  let organizationName = "Your workspace";
  if (membership?.organization_id) {
    const { data } = await supabase.from("organizations").select("name").eq("id", membership.organization_id).maybeSingle();
    if (data?.name) organizationName = data.name;
  }

  return <main className="dashboard-shell">
    <header className="dashboard-topbar"><a className="auth-brand" href="/"><span className="brand-mark">R</span> rentflow</a><form action={signOut}><button className="signout-button">Sign out</button></form></header>
    <section className="dashboard-content">
      <p className="eyebrow">WORKSPACE OVERVIEW</p>
      <h1>Welcome to RentFlow{userData.user?.user_metadata?.full_name ? `, ${userData.user.user_metadata.full_name}` : ""}.</h1>
      <p className="auth-subtitle">{organizationName} · {membership?.role ?? "Member"}</p>
      <div className="notice"><strong>Your workspace is ready for setup</strong><p>Your account is authenticated. Next we'll add property registration, rental units, tenants and lease management.</p></div>
      <div className="metric-grid">
        {[["Properties","—"],["Rental units","—"],["Active tenants","—"],["Outstanding rent","UGX —"]].map(([label,value])=><article className="metric-card" key={label}><p>{label}</p><strong>{value}</strong><small>Portfolio data will appear here</small></article>)}
      </div>
    </section>
  </main>;
}
