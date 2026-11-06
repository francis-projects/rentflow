import { WorkspaceLayout } from "@/components/workspace-layout";
import { getWorkspaceContext } from "@/lib/rentflow/context";
import { getWorkspacePlan } from "@/lib/rentflow/entitlements";

const money=(value:number)=>"UGX "+Math.round(value).toLocaleString("en-UG");
const dateInKampala=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Kampala",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());

export default async function IntelligencePage(){
 const {supabase,organization}=await getWorkspaceContext();
 const plan=await getWorkspacePlan(supabase,organization.id);
 const enabled=(plan?.features as Record<string,unknown>|null)?.ai_insights===true;
 if(!enabled) return <WorkspaceLayout workspaceName={organization.name}>
  <div className="page-heading"><div><p className="eyebrow">PORTFOLIO INTELLIGENCE</p><h1>Portfolio insights</h1><p className="muted">Understand portfolio performance, identify risk and prioritise actions.</p></div></div>
  <section className="panel intelligence-upgrade"><p className="eyebrow">PROFESSIONAL FEATURE</p><h2>Unlock portfolio intelligence</h2><p>Advanced portfolio metrics, arrears risk signals, occupancy analysis and maintenance trends are available on Professional and Enterprise plans.</p><a className="button-secondary" href="/subscription">View subscription plans</a></section>
 </WorkspaceLayout>;
 const today=dateInKampala();
 const monthStart=new Date(today.slice(0,7)+"-01T00:00:00+03:00").toISOString();
 const [{data:properties},{data:units},{data:charges},{data:payments},{data:expenses},{data:maintenance},{data:leases},{data:tenants}]=await Promise.all([
  supabase.from("properties").select("id,name").eq("organization_id",organization.id).is("archived_at",null),
  supabase.from("units").select("id,property_id,status,monthly_rent_minor").eq("organization_id",organization.id),
  supabase.from("rent_charge_balances").select("id,lease_id,charge_period,due_date,amount_minor,paid_minor,balance_minor").eq("organization_id",organization.id),
  supabase.from("payments").select("amount_minor,received_at").eq("organization_id",organization.id).eq("status","posted").gte("received_at",monthStart),
  supabase.from("expenses").select("amount_minor,incurred_on").eq("organization_id",organization.id).eq("status","recorded").gte("incurred_on",today.slice(0,7)+"-01"),
  supabase.from("maintenance_requests").select("id,title,priority,status,due_date,property_id").eq("organization_id",organization.id).not("status","in", "(completed,cancelled)"),
  supabase.from("leases").select("id,tenant_id,unit_id,status").eq("organization_id",organization.id),
  supabase.from("tenants").select("id,full_name").eq("organization_id",organization.id)
 ]);
 const propertyCount=properties?.length??0;
 const unitRows=units??[];
 const occupied=unitRows.filter(u=>u.status==="occupied").length;
 const vacant=unitRows.filter(u=>u.status==="vacant").length;
 const occupancy=unitRows.length?Math.round(occupied/unitRows.length*100):0;
 const currentMonth=(today.slice(0,7)+"-01");
 const monthCharges=(charges??[]).filter(c=>c.charge_period===currentMonth);
 const charged=monthCharges.reduce((s,c)=>s+Number(c.amount_minor),0);
 const collectedAgainstMonthCharges=monthCharges.reduce((s,c)=>s+Math.min(Number(c.amount_minor),Number(c.paid_minor)),0);
 const paidThisMonth=(payments??[]).reduce((s,p)=>s+Number(p.amount_minor),0);
 const expensesThisMonth=(expenses??[]).reduce((s,e)=>s+Number(e.amount_minor),0);
 const collectionRate=charged>0?Math.min(100,Math.round(collectedAgainstMonthCharges/charged*100)):0;
 const overdue=(charges??[]).filter(c=>c.due_date<today&&Number(c.balance_minor)>0);
 const overdueAmount=overdue.reduce((s,c)=>s+Number(c.balance_minor),0);
 const dueSoonEnd=new Date(`${today}T00:00:00Z`);
 dueSoonEnd.setUTCDate(dueSoonEnd.getUTCDate()+7);
 const dueSoonDate=dueSoonEnd.toISOString().slice(0,10);
 const dueSoon=(charges??[]).filter(c=>c.due_date>=today&&c.due_date<=dueSoonDate&&Number(c.balance_minor)>0);
 const openMaintenance=maintenance??[];
 const urgentMaintenance=openMaintenance.filter(m=>m.priority==="urgent"||m.priority==="high");
 const netCash=paidThisMonth-expensesThisMonth;
 const leaseById=new Map((leases??[]).map(l=>[l.id,l]));
 const tenantById=new Map((tenants??[]).map(t=>[t.id,t.full_name]));
 const propertyById=new Map((properties??[]).map(p=>[p.id,p.name]));
 const riskRows=overdue.slice(0,8).map(c=>{
  const lease=leaseById.get(c.lease_id);
  const unit=unitRows.find(u=>u.id===lease?.unit_id);
  return {id:c.id,tenant:tenantById.get(lease?.tenant_id??"")??"Tenant",property:propertyById.get(unit?.property_id??"")??"Property",due:c.due_date,balance:Number(c.balance_minor)};
 });
 const insights:{level:"warning"|"positive"|"info";title:string;body:string;action:string}[]=[];
 if(overdueAmount>0) insights.push({level:"warning",title:"Outstanding rent needs follow-up",body:`${overdue.length} rent charge(s) are overdue, totalling ${money(overdueAmount)}.`,action:"Review the rent ledger and follow up with affected tenants."});
 if(occupancy<85&&unitRows.length>0) insights.push({level:"warning",title:"Vacancy is reducing potential income",body:`${vacant} of ${unitRows.length} units are vacant. Current occupancy is ${occupancy}%.`,action:"Review vacant units, readiness and marketing activity."});
 if(collectionRate>0&&collectionRate<85) insights.push({level:"warning",title:"Current-month collections are below target",body:`${collectionRate}% of this month's rent charges have been collected based on posted payment allocations applied to this month's charges.`,action:"Prioritise reminders and reconcile unallocated payments."});
 if(urgentMaintenance.length>0) insights.push({level:"warning",title:"High-priority maintenance is open",body:`${urgentMaintenance.length} high or urgent maintenance request(s) remain open.`,action:"Assign owners and due dates to the highest-priority jobs."});
 if(netCash<0) insights.push({level:"warning",title:"Recorded expenses exceed collections this month",body:`Recorded expenses exceed posted payment receipts by ${money(Math.abs(netCash))} so far this month.`,action:"Review upcoming costs and outstanding tenant balances."});
 if(dueSoon.length>0) insights.push({level:"info",title:"Rent falls due in the next seven days",body:`${dueSoon.length} outstanding charge(s) are due soon.`,action:"Check that tenants have received payment instructions."});
 if(!insights.length) insights.push({level:"positive",title:"No immediate portfolio warning detected",body:"Current records do not show overdue rent, low occupancy or urgent maintenance requiring attention.",action:"Keep rent, expense and maintenance records up to date."});
 return <WorkspaceLayout workspaceName={organization.name}>
  <div className="page-heading"><div><p className="eyebrow">PORTFOLIO INTELLIGENCE</p><h1>Portfolio insights</h1><p className="muted">Operational signals calculated from your recorded portfolio data.</p></div><span className="status-pill">Updated {today}</span></div>
  <section className="intelligence-metric-grid">
   <article className="intelligence-metric"><small>Properties</small><strong>{propertyCount}</strong><span>Active properties</span></article>
   <article className="intelligence-metric"><small>Occupancy</small><strong>{occupancy}%</strong><span>{occupied} occupied · {vacant} vacant</span></article>
   <article className="intelligence-metric"><small>Overdue rent</small><strong>{money(overdueAmount)}</strong><span>{overdue.length} overdue charge(s)</span></article>
   <article className="intelligence-metric"><small>Charge collection rate</small><strong>{collectionRate}%</strong><span>Payments allocated to this month's charges</span></article>
   <article className="intelligence-metric"><small>Payments received</small><strong>{money(paidThisMonth)}</strong><span>Posted payments this month</span></article>
   <article className="intelligence-metric"><small>Recorded expenses</small><strong>{money(expensesThisMonth)}</strong><span>Expenses this month</span></article>
  </section>
  <section className="panel intelligence-insights"><div className="section-heading"><div><h2>Recommended actions</h2><p className="muted">Prioritised signals based on current records.</p></div><span>{insights.length} insight(s)</span></div>
   <div className="insight-list">{insights.map((item,i)=><article className={"insight-card insight-"+item.level} key={item.title}><div className="insight-number">{String(i+1).padStart(2,"0")}</div><div><strong>{item.title}</strong><p>{item.body}</p><small>{item.action}</small></div></article>)}</div>
  </section>
  <section className="panel table-panel"><div className="section-heading"><h2>Overdue rent watchlist</h2><span>{overdue.length} charges</span></div>
   {!riskRows.length?<p className="empty-state">No overdue balances found in the current rent ledger.</p>:<div className="table-wrap"><table><thead><tr><th>Tenant</th><th>Property</th><th>Due date</th><th>Outstanding (UGX)</th></tr></thead><tbody>{riskRows.map(r=><tr key={r.id}><td><strong>{r.tenant}</strong></td><td>{r.property}</td><td>{r.due}</td><td><strong>{r.balance.toLocaleString("en-UG")}</strong></td></tr>)}</tbody></table></div>}
  </section>
  <section className="panel intelligence-footnote"><strong>How these insights work</strong><p>These are explainable, rule-based indicators from your RentFlow records, not AI-generated advice. Charge collection rate uses posted payment allocations applied to charges raised for the current month, divided by those charges. Cash received this month is shown separately and may include payments for earlier rent periods. The AI narrative layer can be added once the model provider and credentials are configured.</p></section>
 </WorkspaceLayout>;
}
