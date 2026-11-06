"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getWorkspaceContext } from "@/lib/rentflow/context";

function value(data: FormData, key: string) { return String(data.get(key) ?? "").trim(); }
function number(data: FormData, key: string) { return Number(value(data, key)); }

export async function createProperty(data: FormData) {
  const { supabase, organization } = await getWorkspaceContext();
  const name=value(data,"name");
  if (!name) redirect("/properties?error=Enter%20a%20property%20name");
  const { error } = await supabase.from("properties").insert({
    organization_id:organization.id,name,property_type:value(data,"property_type")||"residential",
    address_line:value(data,"address_line")||null,district:value(data,"district")||null,
    city:value(data,"city")||null,notes:value(data,"notes")||null
  });
  if(error) redirect("/properties?error="+encodeURIComponent(error.message));
  revalidatePath("/properties"); revalidatePath("/dashboard"); redirect("/properties?success=Property%20added");
}

export async function createUnit(data: FormData) {
  const {supabase,organization}=await getWorkspaceContext();
  const rent=number(data,"monthly_rent");
  if(!value(data,"property_id")||!value(data,"unit_code")||!Number.isSafeInteger(rent)||rent<0) redirect("/properties?error=Check%20the%20unit%20details");
  const {error}=await supabase.from("units").insert({
    organization_id:organization.id,property_id:value(data,"property_id"),unit_code:value(data,"unit_code"),
    floor_label:value(data,"floor_label")||null,bedrooms:value(data,"bedrooms")?number(data,"bedrooms"):null,
    bathrooms:value(data,"bathrooms")?Number(value(data,"bathrooms")):null,monthly_rent_minor:rent
  });
  if(error) redirect("/properties?error="+encodeURIComponent(error.message));
  revalidatePath("/properties"); redirect("/properties?success=Unit%20added");
}

export async function createOwner(data: FormData) {
  const {supabase,organization}=await getWorkspaceContext();
  const full_name=value(data,"full_name");
  if(!full_name) redirect("/owners?error=Enter%20the%20owner%20name");
  const {error}=await supabase.from("owners").insert({organization_id:organization.id,full_name,email:value(data,"email")||null,phone:value(data,"phone")||null,postal_address:value(data,"postal_address")||null});
  if(error) redirect("/owners?error="+encodeURIComponent(error.message));
  revalidatePath("/owners"); redirect("/owners?success=Owner%20added");
}

export async function createTenant(data: FormData) {
  const {supabase,organization}=await getWorkspaceContext();
  const full_name=value(data,"full_name");
  if(!full_name) redirect("/tenants?error=Enter%20the%20tenant%20name");
  const {error}=await supabase.from("tenants").insert({organization_id:organization.id,full_name,email:value(data,"email")||null,phone:value(data,"phone")||null,emergency_contact_name:value(data,"emergency_contact_name")||null,emergency_contact_phone:value(data,"emergency_contact_phone")||null,notes:value(data,"notes")||null});
  if(error) redirect("/tenants?error="+encodeURIComponent(error.message));
  revalidatePath("/tenants"); redirect("/tenants?success=Tenant%20added");
}

export async function createLease(data: FormData) {
  const {supabase,organization}=await getWorkspaceContext();
  const rent=number(data,"rent_amount"), deposit=number(data,"deposit_amount");
  const payload={organization_id:organization.id,unit_id:value(data,"unit_id"),tenant_id:value(data,"tenant_id"),lease_reference:value(data,"lease_reference")||null,start_date:value(data,"start_date"),end_date:value(data,"end_date")||null,rent_amount_minor:rent,deposit_amount_minor:deposit,due_day:number(data,"due_day")||1,status:"active" as const,terms:value(data,"terms")||null};
  if(!payload.unit_id||!payload.tenant_id||!payload.start_date||!Number.isSafeInteger(rent)||rent<0||!Number.isSafeInteger(deposit)||deposit<0) redirect("/leases?error=Complete%20the%20required%20lease%20details");
  const {error}=await supabase.from("leases").insert(payload);
  if(error) redirect("/leases?error="+encodeURIComponent(error.message));
  await supabase.from("units").update({status:"occupied"}).eq("id",payload.unit_id).eq("organization_id",organization.id);
  revalidatePath("/leases"); revalidatePath("/properties"); redirect("/leases?success=Lease%20created");
}

export async function generateRentCharges() {
  const {supabase,organization}=await getWorkspaceContext();
  const period=new Date(); const month=period.toISOString().slice(0,10);
  const {error}=await supabase.rpc("generate_monthly_rent_charges",{p_organization_id:organization.id,p_period:month});
  if(error) redirect("/rent?error="+encodeURIComponent(error.message));
  revalidatePath("/rent"); revalidatePath("/dashboard"); redirect("/rent?success=Rent%20charges%20generated");
}

export async function recordPayment(data: FormData) {
  const {supabase,organization}=await getWorkspaceContext();
  const amount=number(data,"amount_minor");
  const chargeId=value(data,"rent_charge_id");
  const allocations=chargeId?[{rent_charge_id:chargeId,amount_minor:amount}]:[];
  const {error}=await supabase.rpc("record_rent_payment",{
    p_organization_id:organization.id,p_tenant_id:value(data,"tenant_id"),
    p_lease_id:value(data,"lease_id")||null,p_amount_minor:amount,
    p_payment_method:value(data,"payment_method"),p_payment_reference:value(data,"payment_reference")||null,
    p_received_at:value(data,"received_at")?new Date(value(data,"received_at")).toISOString():new Date().toISOString(),
    p_notes:value(data,"notes")||null,p_allocations:allocations
  });
  if(error) redirect("/rent?error="+encodeURIComponent(error.message));
  revalidatePath("/rent"); revalidatePath("/dashboard"); redirect("/rent?success=Payment%20recorded");
}

export async function createExpense(data: FormData) {
  const {supabase,organization,userId}=await getWorkspaceContext();
  const amount=number(data,"amount_minor");
  if(!Number.isSafeInteger(amount)||amount<=0||!value(data,"description")) redirect("/expenses?error=Enter%20a%20description%20and%20valid%20amount");
  const {error}=await supabase.from("expenses").insert({
    organization_id:organization.id,property_id:value(data,"property_id")||null,category:value(data,"category"),
    description:value(data,"description"),amount_minor:amount,incurred_on:value(data,"incurred_on"),
    vendor_name:value(data,"vendor_name")||null,reference:value(data,"reference")||null,recorded_by:userId
  });
  if(error) redirect("/expenses?error="+encodeURIComponent(error.message));
  revalidatePath("/expenses"); revalidatePath("/dashboard"); redirect("/expenses?success=Expense%20recorded");
}
