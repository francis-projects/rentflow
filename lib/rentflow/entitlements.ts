import { redirect } from "next/navigation";
import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function getWorkspacePlan(supabase: SupabaseClient, organizationId: string) {
  const { data: subscription } = await supabase
    .from("organization_subscriptions")
    .select("plan_id,status")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!subscription) return null;
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("id,code,name,max_properties,max_units,max_team_members,features")
    .eq("id", subscription.plan_id)
    .maybeSingle();
  if (!plan) return null;
  return { ...plan, subscriptionStatus: subscription.status };
}

export async function requirePlanFeature(
  supabase: SupabaseClient,
  organizationId: string,
  feature: string
) {
  const plan = await getWorkspacePlan(supabase, organizationId);
  if (!plan || plan.subscriptionStatus === "cancelled" || plan.subscriptionStatus === "paused" ||
      (plan.features as Record<string, unknown> | null)?.[feature] !== true) {
    redirect("/subscription?error=This%20feature%20is%20not%20included%20in%20your%20current%20plan");
  }
  return plan;
}
