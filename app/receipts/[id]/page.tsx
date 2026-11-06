import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkspaceContext } from "@/lib/rentflow/context";
import { WorkspaceLayout } from "@/components/workspace-layout";
export default async function ReceiptPage({params}:{params:Promise<{id:string}>}) {
 const {id}=await params; const {supabase,organization}=await getWorkspaceContext();
 const {data:payment}=await supabase.from("payments").select("*").eq("id",id).eq("organization_id",organization.id).maybeSingle();
 if(!payment) notFound();
 const [{data:tenant},{data:allocations}]=await Promise.all([
  supabase.from("tenants").select("full_name,email,phone").eq("id",payment.tenant_id).maybeSingle(),
  supabase.from("payment_allocations").select("amount_minor,rent_charge_id").eq("payment_id",payment.id).eq("organization_id",organization.id)
 ]);
 return <WorkspaceLayout workspaceName={organization.name}><div className="page-heading no-print"><div><p className="eyebrow">PAYMENT RECORD</p><h1>Payment receipt</h1><p className="muted">Receipt reference {payment.id.slice(0,8).toUpperCase()}</p></div><div className="quick-links"><button onClick="window.print()">Print receipt</button><Link href="/rent">Back to rent ledger</Link></div></div>
 <article className="receipt-card"><header><div className="auth-brand"><span className="brand-mark">R</span>rentflow</div><p>PAYMENT RECEIPT</p></header><div className="receipt-amount"><small>Amount received</small><strong>UGX {Number(payment.amount_minor).toLocaleString("en-UG")}</strong></div><div className="receipt-grid"><div><small>Received from</small><strong>{tenant?.full_name??"Tenant"}</strong><span>{tenant?.phone??tenant?.email??""}</span></div><div><small>Date received</small><strong>{new Date(payment.received_at).toLocaleString("en-UG")}</strong></div><div><small>Payment method</small><strong>{payment.payment_method.replaceAll("_"," ")}</strong></div><div><small>Payment reference</small><strong>{payment.payment_reference??"Not supplied"}</strong></div><div><small>Lease reference</small><strong>{payment.lease_id??"Not linked"}</strong></div><div><small>Receipt ID</small><strong>{payment.id.toUpperCase()}</strong></div></div><section className="receipt-allocation"><h3>Rent allocation</h3>{allocations?.length?allocations.map((a)=><p key={a.rent_charge_id}>Rent charge {a.rent_charge_id.slice(0,8)} · UGX {Number(a.amount_minor).toLocaleString("en-UG")}</p>):<p>This payment has not been allocated to a rent charge.</p>}</section><footer>Thank you. Please retain this receipt for your records.</footer></article></WorkspaceLayout>;
}