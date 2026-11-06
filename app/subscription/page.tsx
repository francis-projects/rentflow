import { WorkspaceLayout } from "@/components/workspace-layout";
import { getWorkspaceContext } from "@/lib/rentflow/context";
import { requestPlanChange } from "@/app/actions/subscription";

const featureLabels: Record<string,string> = {
 rent_ledger:"Rent ledger",tenant_documents:"Tenant document storage",maintenance:"Maintenance management",
 owner_statements:"Owner statements",owner_payouts:"Owner payout tracking",financial_exports:"Financial exports",team_management:"Team management",
 automated_reminders:"Automated rent reminders",ai_insights:"AI portfolio insights",priority_support:"Priority support"
};
const limitLabel=(value:number|null)=>value===null?"Unlimited":String(value);
const currency=(amount:number|null)=>amount===null?"Contact us":amount===0?"Free": "USD "+new Intl.NumberFormat("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}).format(amount/100);

export default async function SubscriptionPage({searchParams}:{searchParams:Promise<{error?:string;success?:string}>}) {
 const {supabase,organization,membership}=await getWorkspaceContext();
 const [{data:plans},{data:subscription},{data:pending},params]=await Promise.all([
  supabase.from("subscription_plans").select("id,code,name,description,monthly_price_minor,annual_price_minor,max_properties,max_units,max_team_members,features").eq("is_active",true).order("sort_order"),
  supabase.from("organization_subscriptions").select("id,plan_id,status,billing_interval,current_period_start,current_period_end,trial_ends_at").eq("organization_id",organization.id).maybeSingle(),
  supabase.from("subscription_change_requests").select("id,requested_plan_id,billing_interval,created_at").eq("organization_id",organization.id).eq("status","pending").order("created_at",{ascending:false}).limit(1).maybeSingle(),
  searchParams
 ]);
 const currentPlan=plans?.find(p=>p.id===subscription?.plan_id);
 const pendingPlan=plans?.find(p=>p.id===pending?.requested_plan_id);
 const canRequest=["owner","admin"].includes(membership.role);
 return <WorkspaceLayout workspaceName={organization.name}>
  <div className="page-heading"><div><p className="eyebrow">WORKSPACE PLAN</p><h1>Subscription</h1><p className="muted">Manage your RentFlow plan, portfolio limits and available features.</p></div><span className="status-pill">{subscription?.status??"No plan"}</span></div>
  {params.error&&<p className="error-message">{params.error}</p>}{params.success&&<p className="success-message">{params.success}</p>}
  <section className="panel current-plan-panel">
   <div><p className="eyebrow">CURRENT PLAN</p><h2>{currentPlan?.name??"Plan not assigned"}</h2><p className="muted">{currentPlan?.description??"Contact support to confirm your workspace subscription."}</p></div>
   <div className="current-plan-meta"><strong>{subscription?.status??"Unassigned"}</strong><small>Billing: {subscription?.billing_interval??"—"}</small>{subscription?.current_period_end&&<small>Period ends {new Date(subscription.current_period_end).toLocaleDateString("en-UG")}</small>}</div>
  </section>
  {pending&&<section className="panel pending-plan-panel"><strong>Plan change request pending</strong><p>Your request for the {pendingPlan?.name??"selected"} plan ({pending.billing_interval}) was submitted on {new Date(pending.created_at).toLocaleDateString("en-UG")}. Your current plan remains active until the request is reviewed and any required payment arrangement is completed.</p></section>}
  <div className="section-heading subscription-section-heading"><div><h2>Available plans</h2><p className="muted">USD subscription pricing. Property rents, deposits and operational records remain in UGX.</p></div></div>
  <div className="plan-grid">{(plans??[]).map(plan=>{
   const features=Object.entries((plan.features??{}) as Record<string,unknown>).filter(([,enabled])=>enabled===true);
   const isCurrent=plan.id===subscription?.plan_id;
   return <article className={"plan-card "+(isCurrent?"plan-current":"")} key={plan.id}>
    <div className="plan-card-top"><div><p className="eyebrow">{plan.code.toUpperCase()}</p><h3>{plan.name}</h3></div>{isCurrent&&<span className="status-pill">Current</span>}</div>
    <p className="plan-description">{plan.description}</p>
    <div className="plan-price">{currency(plan.monthly_price_minor)}<small>{plan.monthly_price_minor===0?"/ month":plan.monthly_price_minor===null?" pricing pending":"/ month"}</small></div>
    <div className="plan-limits"><div><strong>{limitLabel(plan.max_properties)}</strong><small>Properties</small></div><div><strong>{limitLabel(plan.max_units)}</strong><small>Units</small></div><div><strong>{limitLabel(plan.max_team_members)}</strong><small>Team members</small></div></div>
    <div className="plan-feature-list">{features.map(([key])=><div key={key}><span>✓</span>{featureLabels[key]??key.replaceAll("_"," ")}</div>)}</div>
    {canRequest&&!isCurrent&&!pending&&<form action={requestPlanChange} className="plan-request-form">
      <input type="hidden" name="plan_id" value={plan.id}/>
      <label>Billing interval<select name="billing_interval" defaultValue="monthly"><option value="monthly">Monthly</option><option value="annual">Annual</option></select></label>
      <button className="button-primary" type="submit">Request this plan</button>
    </form>}
    {isCurrent&&<div className="plan-current-note">Your workspace is currently on this plan.</div>}
   </article>;
  })}</div>
  <section className="panel billing-note"><h2>Payments and billing</h2><p>Plan selection and change requests are available. Subscription billing is being prepared in USD. Flutterwave is the first planned gateway, behind a provider-independent payment adapter so another gateway can be added later. Checkout, webhook verification, invoices and renewals are not enabled yet; no payment is collected when you request a plan change.</p></section>
 </WorkspaceLayout>;
}
