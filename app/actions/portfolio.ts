"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getWorkspaceContext } from "@/lib/rentflow/context";
import { getWorkspacePlan, requirePlanFeature } from "@/lib/rentflow/entitlements";

function value(data: FormData, key: string) { return String(data.get(key) ?? "").trim(); }
function number(data: FormData, key: string) { return Number(value(data, key)); }
function kampalaDate() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Kampala", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }

export async function createProperty(data: FormData) {
  const { supabase, organization } = await getWorkspaceContext();
  const plan = await getWorkspacePlan(supabase, organization.id);
  if (plan?.max_properties !== null && plan?.max_properties !== undefined) {
    const { count } = await supabase.from("properties").select("id", { count: "exact", head: true }).eq("organization_id", organization.id);
    if ((count ?? 0) >= plan.max_properties) redirect("/subscription?error=Your%20current%20plan%20property%20limit%20has%20been%20reached");
  }
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
  const plan = await getWorkspacePlan(supabase, organization.id);
  if (plan?.max_units !== null && plan?.max_units !== undefined) {
    const { count } = await supabase.from("units").select("id", { count: "exact", head: true }).eq("organization_id", organization.id);
    if ((count ?? 0) >= plan.max_units) redirect("/subscription?error=Your%20current%20plan%20unit%20limit%20has%20been%20reached");
  }
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
  const month=kampalaDate();
  const {error}=await supabase.rpc("generate_monthly_rent_charges",{p_organization_id:organization.id,p_period:month});
  if(error) redirect("/rent?error="+encodeURIComponent(error.message));
  revalidatePath("/rent"); revalidatePath("/dashboard"); redirect("/rent?success=Rent%20charges%20generated");
}

export async function recordPayment(data: FormData) {
  const {supabase,organization}=await getWorkspaceContext();
  const amount=number(data,"amount_minor");
  const allocations=[];
  for(let i=1;i<=5;i++){
    const chargeId=value(data,"allocation_charge_"+i);
    const allocationAmount=number(data,"allocation_amount_"+i);
    if(chargeId||allocationAmount){
      if(!chargeId||!Number.isSafeInteger(allocationAmount)||allocationAmount<=0) redirect("/rent?error=Complete%20each%20allocation%20row%20with%20a%20valid%20amount");
      allocations.push({rent_charge_id:chargeId,amount_minor:allocationAmount});
    }
  }
  if(allocations.reduce((sum,a)=>sum+a.amount_minor,0)>amount) redirect("/rent?error=Allocated%20amounts%20cannot%20exceed%20the%20payment");
  const {data:paymentId,error}=await supabase.rpc("record_rent_payment",{
    p_organization_id:organization.id,p_tenant_id:value(data,"tenant_id"),
    p_lease_id:value(data,"lease_id")||null,p_amount_minor:amount,
    p_payment_method:value(data,"payment_method"),p_payment_reference:value(data,"payment_reference")||null,
    p_received_at:value(data,"received_at")?new Date(value(data,"received_at")).toISOString():new Date().toISOString(),
    p_notes:value(data,"notes")||null,p_allocations:allocations
  });
  if(error) redirect("/rent?error="+encodeURIComponent(error.message));
  revalidatePath("/rent"); revalidatePath("/dashboard"); if(paymentId) redirect("/receipts/"+paymentId); redirect("/rent?success=Payment%20recorded");
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

export async function assignPropertyOwner(data: FormData) {
  const {supabase,organization}=await getWorkspaceContext();
  const property_id=value(data,"property_id"), owner_id=value(data,"owner_id");
  const ownership_percent=Number(value(data,"ownership_percent"));
  if(!property_id||!owner_id||!Number.isFinite(ownership_percent)||ownership_percent<=0||ownership_percent>100) redirect("/owners?error=Enter%20a%20valid%20property%20owner%20allocation");
  const {error}=await supabase.from("property_owners").upsert({organization_id:organization.id,property_id,owner_id,ownership_percent},{onConflict:"property_id,owner_id"});
  if(error) redirect("/owners?error="+encodeURIComponent(error.message));
  revalidatePath("/owners"); redirect("/owners?success=Property%20ownership%20updated");
}

export async function reversePayment(data: FormData) {
  const {supabase,organization}=await getWorkspaceContext();
  const paymentId=value(data,"payment_id"), reason=value(data,"reason");
  if(!paymentId||reason.length<5) redirect("/rent?error=Enter%20a%20clear%20reason%20for%20reversal");
  const {error}=await supabase.rpc("reverse_rent_payment",{p_organization_id:organization.id,p_payment_id:paymentId,p_reason:reason});
  if(error) redirect("/rent?error="+encodeURIComponent(error.message));
  revalidatePath("/rent"); revalidatePath("/dashboard"); revalidatePath("/reports");
  redirect("/rent?success=Payment%20reversed%20with%20audit%20record");
}

export async function createMaintenanceRequest(data: FormData) {
  const {supabase,organization,userId}=await getWorkspaceContext();
  const title=value(data,"title"), propertyId=value(data,"property_id");
  if(title.length<3||!propertyId) redirect("/maintenance?error=Enter%20a%20title%20and%20select%20a%20property");
  const {error}=await supabase.from("maintenance_requests").insert({
    organization_id:organization.id,property_id:propertyId,unit_id:value(data,"unit_id")||null,
    title,description:value(data,"description")||null,category:value(data,"category")||"general",
    priority:value(data,"priority")||"normal",due_date:value(data,"due_date")||null,reported_by:userId
  });
  if(error) redirect("/maintenance?error="+encodeURIComponent(error.message));
  revalidatePath("/maintenance"); revalidatePath("/dashboard"); redirect("/maintenance?success=Maintenance%20request%20created");
}

export async function updateMaintenanceStatus(data: FormData) {
  const {supabase,organization}=await getWorkspaceContext();
  const id=value(data,"request_id"), status=value(data,"status");
  if(!id||!["open","in_progress","waiting","completed","cancelled"].includes(status)) redirect("/maintenance?error=Invalid%20maintenance%20status");
  const {error}=await supabase.from("maintenance_requests").update({
    status,completed_at:status==="completed"?new Date().toISOString():null,updated_at:new Date().toISOString()
  }).eq("id",id).eq("organization_id",organization.id);
  if(error) redirect("/maintenance?error="+encodeURIComponent(error.message));
  revalidatePath("/maintenance"); revalidatePath("/dashboard"); redirect("/maintenance?success=Maintenance%20request%20updated");
}

export async function uploadTenantDocument(data: FormData) {
  const {supabase,organization,userId}=await getWorkspaceContext();
  await requirePlanFeature(supabase, organization.id, "tenant_documents");
  const tenantId=value(data,"tenant_id"), file=data.get("document");
  if(!(file instanceof File)||file.size===0||file.size>10*1024*1024) redirect("/tenants?error=Choose%20a%20file%20up%20to%2010MB");
  if(!["application/pdf","image/jpeg","image/png"].includes(file.type)) redirect("/tenants?error=Only%20PDF,%20JPG%20and%20PNG%20files%20are%20allowed");
  const {data:tenant,error:tenantError}=await supabase.from("tenants").select("id").eq("id",tenantId).eq("organization_id",organization.id).maybeSingle();
  if(tenantError||!tenant) redirect("/tenants?error=Select%20a%20valid%20tenant");
  const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(-100)||"document";
  const path=organization.id+"/"+tenantId+"/"+crypto.randomUUID()+"-"+safeName;
  const {error:uploadError}=await supabase.storage.from("tenant-documents").upload(path,file,{contentType:file.type,upsert:false});
  if(uploadError) redirect("/tenants?error="+encodeURIComponent(uploadError.message));
  const {error}=await supabase.from("tenant_documents").insert({
    organization_id:organization.id,tenant_id:tenantId,file_name:file.name,storage_path:path,
    content_type:file.type,size_bytes:file.size,document_type:value(data,"document_type")||"other",
    notes:value(data,"notes")||null,uploaded_by:userId
  });
  if(error){await supabase.storage.from("tenant-documents").remove([path]);redirect("/tenants?error="+encodeURIComponent(error.message));}
  revalidatePath("/tenants"); redirect("/tenants?success=Document%20uploaded%20securely");
}

export async function deleteTenantDocument(data: FormData) {
 const {supabase,organization}=await getWorkspaceContext();
 const id=value(data,"document_id");
 const {data:doc,error:readError}=await supabase.from("tenant_documents").select("id,storage_path").eq("id",id).eq("organization_id",organization.id).maybeSingle();
 if(readError||!doc) redirect("/tenants?error=Document%20not%20found");
 const {error}=await supabase.storage.from("tenant-documents").remove([doc.storage_path]);
 if(error) redirect("/tenants?error="+encodeURIComponent(error.message));
 const {error:dbError}=await supabase.from("tenant_documents").delete().eq("id",id).eq("organization_id",organization.id);
 if(dbError) redirect("/tenants?error="+encodeURIComponent(dbError.message));
 revalidatePath("/tenants"); redirect("/tenants?success=Document%20deleted");
}

export async function updateOrganisationMemberRole(data: FormData) {
  const {supabase,organization}=await getWorkspaceContext();
  await requirePlanFeature(supabase, organization.id, "team_management");
  const memberId=value(data,"member_id"), role=value(data,"role");
  if(!memberId||!["admin","manager","accountant","staff"].includes(role)) redirect("/team?error=Select%20a%20valid%20team%20role");
  const {data:updated,error}=await supabase.from("organization_members").update({role:role as "admin"|"manager"|"accountant"|"staff"}).eq("id",memberId).eq("organization_id",organization.id).select("id").maybeSingle();
  if(error||!updated) redirect("/team?error="+encodeURIComponent(error?.message??"You do not have permission to change this member"));
  revalidatePath("/team"); redirect("/team?success=Member%20role%20updated");
}

export async function removeOrganisationMember(data: FormData) {
  const {supabase,organization,userId}=await getWorkspaceContext();
  await requirePlanFeature(supabase, organization.id, "team_management");
  const memberId=value(data,"member_id");
  if(!memberId) redirect("/team?error=Select%20a%20team%20member");
  const {data:target,error:readError}=await supabase.from("organization_members").select("id,user_id,role").eq("id",memberId).eq("organization_id",organization.id).maybeSingle();
  if(readError||!target) redirect("/team?error=Team%20member%20not%20found");
  if(target.user_id===userId) redirect("/team?error=You%20cannot%20remove%20yourself%20from%20the%20workspace");
  const {error}=await supabase.from("organization_members").delete().eq("id",memberId).eq("organization_id",organization.id);
  if(error) redirect("/team?error="+encodeURIComponent(error.message));
  revalidatePath("/team"); redirect("/team?success=Member%20removed%20from%20workspace");
}

export async function allocateExpenseToProperty(data: FormData) {
 const {supabase,organization}=await getWorkspaceContext();
 const expenseId=value(data,"expense_id"),propertyId=value(data,"property_id"),amount=number(data,"amount_minor");
 if(!expenseId||!propertyId||!Number.isSafeInteger(amount)||amount<=0) redirect("/expenses?error=Enter%20a%20valid%20expense%20allocation");
 const [{data:expense,error:expenseError},{data:property,error:propertyError},{data:existing,error:allocationError}]=await Promise.all([
  supabase.from("expenses").select("id,amount_minor,property_id,unit_id,status").eq("id",expenseId).eq("organization_id",organization.id).maybeSingle(),
  supabase.from("properties").select("id").eq("id",propertyId).eq("organization_id",organization.id).maybeSingle(),
  supabase.from("expense_allocations").select("amount_minor").eq("expense_id",expenseId).eq("organization_id",organization.id)
 ]);
 if(expenseError||!expense||expense.status!=="recorded") redirect("/expenses?error=Select%20a%20recorded%20expense");
 if(expense.property_id||expense.unit_id) redirect("/expenses?error=Only%20portfolio-wide%20expenses%20can%20be%20allocated");
 if(propertyError||!property) redirect("/expenses?error=Select%20a%20valid%20property");
 if(allocationError) redirect("/expenses?error=Could%20not%20verify%20existing%20allocations");
 const alreadyAllocated=(existing??[]).reduce((sum,item)=>sum+Number(item.amount_minor),0);
 if(alreadyAllocated+amount>Number(expense.amount_minor)) redirect("/expenses?error=Allocations%20cannot%20exceed%20the%20remaining%20expense%20amount");
 const {error}=await supabase.from("expense_allocations").insert({organization_id:organization.id,expense_id:expenseId,property_id:propertyId,amount_minor:amount});
 if(error) redirect("/expenses?error="+encodeURIComponent(error.message));
 revalidatePath("/expenses"); revalidatePath("/owners"); revalidatePath("/reports"); redirect("/expenses?success=Expense%20allocated%20to%20property");
}
export async function recordOwnerPayout(data: FormData) {
 const {supabase,organization,userId}=await getWorkspaceContext();
 await requirePlanFeature(supabase, organization.id, "owner_payouts");
 const ownerId=value(data,"owner_id"),propertyId=value(data,"property_id"),amount=number(data,"amount_minor"),paidOn=value(data,"paid_on"),method=value(data,"payment_method");
 if(!ownerId||!propertyId||!paidOn||!Number.isSafeInteger(amount)||amount<=0||!["cash","bank_transfer","mobile_money","cheque","other"].includes(method)) redirect("/owners?error=Complete%20the%20owner%20payout%20details");
 const {data:ownership,error:ownershipError}=await supabase.from("property_owners").select("id").eq("organization_id",organization.id).eq("owner_id",ownerId).eq("property_id",propertyId).maybeSingle();
 if(ownershipError||!ownership) redirect("/owners?error=The%20selected%20owner%20is%20not%20assigned%20to%20that%20property");
 const {error}=await supabase.from("owner_payouts").insert({organization_id:organization.id,owner_id:ownerId,property_id:propertyId,amount_minor:amount,paid_on:paidOn,payment_method:method,reference:value(data,"reference")||null,notes:value(data,"notes")||null,recorded_by:userId});
 if(error) redirect("/owners?error="+encodeURIComponent(error.message));
 revalidatePath("/owners"); revalidatePath("/reports"); redirect("/owners?success=Owner%20payout%20recorded");
}

export async function markNotificationRead(data: FormData) {
  const {supabase,userId}=await getWorkspaceContext();
  const id=value(data,"notification_id");
  if(!id) redirect("/notifications");
  const {error}=await supabase.from("notifications").update({read_at:new Date().toISOString()}).eq("id",id).eq("user_id",userId);
  if(error) redirect("/notifications?error="+encodeURIComponent(error.message));
  revalidatePath("/notifications");
  redirect("/notifications");
}
