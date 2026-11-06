"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getWorkspaceContext } from "@/lib/rentflow/context";

export async function requestPlanChange(data: FormData) {
  const { supabase, organization, membership, userId } = await getWorkspaceContext();
  if (!["owner", "admin"].includes(membership.role)) {
    redirect("/subscription?error=Only%20workspace%20owners%20and%20administrators%20can%20request%20a%20plan%20change");
  }
  const planId = String(data.get("plan_id") ?? "").trim();
  const interval = String(data.get("billing_interval") ?? "monthly").trim();
  const notes = String(data.get("notes") ?? "").trim();
  if (!planId || !["monthly", "annual"].includes(interval)) {
    redirect("/subscription?error=Choose%20a%20valid%20plan%20and%20billing%20interval");
  }
  const { data: plan, error: planError } = await supabase
    .from("subscription_plans").select("id,code,is_active").eq("id", planId).maybeSingle();
  if (planError || !plan || !plan.is_active) {
    redirect("/subscription?error=That%20plan%20is%20not%20available");
  }
  const { data: existing } = await supabase
    .from("subscription_change_requests").select("id")
    .eq("organization_id", organization.id).eq("status", "pending").limit(1).maybeSingle();
  if (existing) redirect("/subscription?error=Your%20workspace%20already%20has%20a%20pending%20plan%20request");
  const { error } = await supabase.from("subscription_change_requests").insert({
    organization_id: organization.id,
    requested_plan_id: plan.id,
    requested_by: userId,
    billing_interval: interval,
    notes: notes || null
  });
  if (error) redirect("/subscription?error=" + encodeURIComponent(error.message));
  revalidatePath("/subscription");
  redirect("/subscription?success=Plan%20change%20request%20submitted");
}
