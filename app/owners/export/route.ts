import { NextResponse } from "next/server";
import { getWorkspaceContext } from "@/lib/rentflow/context";
import { getWorkspacePlan } from "@/lib/rentflow/entitlements";

function csv(value: unknown) {
 const text=String(value??"");
 return '"' + text.replace(/"/g,'""') + '"';
}

export async function GET() {
 const {supabase,organization}=await getWorkspaceContext();
 const plan=await getWorkspacePlan(supabase,organization.id);
 if((plan?.features as Record<string,unknown>|null)?.owner_statements!==true) return NextResponse.json({error:"Owner statements are not included in your current plan"},{status:403});
 const {data,error}=await supabase.from("owner_monthly_statements").select("*")
  .eq("organization_id",organization.id).order("statement_month",{ascending:false});
 if(error) return NextResponse.json({error:"Unable to export owner statements"},{status:500});
 const rows=[
  ["Month","Owner","Property","Ownership %","Rent received (UGX)","Property expenses (UGX)","Owner rent share (UGX)","Owner expense share (UGX)","Owner net before payouts (UGX)"],
  ...(data??[]).map(s=>[s.statement_month,s.owner_name,s.property_name,s.ownership_percent,s.property_rent_received_minor,s.property_expenses_minor,s.owner_rent_share_minor,s.owner_expense_share_minor,s.owner_net_minor])
 ];
 const body="\uFEFF"+rows.map(row=>row.map(csv).join(",")).join("\r\n");
 return new NextResponse(body,{headers:{
  "Content-Type":"text/csv; charset=utf-8",
  "Content-Disposition":'attachment; filename="rentflow-owner-statements.csv"',
  "Cache-Control":"no-store"
 }});
}
