import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getWorkspaceContext() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (!membership) redirect("/signup");
  const { data: organization } = await supabase
    .from("organizations").select("id,name,currency_code").eq("id", membership.organization_id).single();
  return { supabase, userId, membership, organization };
}
