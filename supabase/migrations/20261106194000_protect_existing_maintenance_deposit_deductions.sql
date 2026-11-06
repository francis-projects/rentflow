-- Prevent repeat maintenance saves from silently changing or clearing a posted deposit deduction.
create or replace function public.record_maintenance_cost_and_deposit_deduction(p_organization_id uuid,p_request_id uuid,p_cost_minor bigint,p_tenant_damage boolean,p_lease_id uuid,p_deduction_minor bigint,p_description text)
returns void language plpgsql security definer set search_path=''
as $$
declare v_request public.maintenance_requests%rowtype; v_lease public.leases%rowtype; v_balance bigint; v_existing bigint;
begin
 if auth.uid() is null or not private.has_org_role(p_organization_id,array['owner','admin','manager','accountant']::public.organization_role[]) then raise exception 'Not authorised'; end if;
 if p_cost_minor<0 or p_deduction_minor<0 or p_deduction_minor>p_cost_minor then raise exception 'Invalid maintenance or deduction amounts'; end if;
 select * into v_request from public.maintenance_requests where id=p_request_id and organization_id=p_organization_id for update;
 if not found then raise exception 'Maintenance request not found'; end if;
 select amount_minor into v_existing from public.security_deposit_transactions where maintenance_request_id=p_request_id and organization_id=p_organization_id;
 if found and (p_deduction_minor=0 or p_deduction_minor<>v_existing) then raise exception 'A deposit deduction is already recorded; it cannot be silently removed or changed'; end if;
 if p_deduction_minor>0 then
  if not p_tenant_damage or p_lease_id is null or v_request.unit_id is null then raise exception 'Tenant-caused damage, unit and responsible lease are required'; end if;
  select * into v_lease from public.leases where id=p_lease_id and organization_id=p_organization_id and unit_id=v_request.unit_id and start_date<=v_request.reported_at::date and(end_date is null or end_date>=v_request.reported_at::date) for update;
  if not found then raise exception 'Lease did not occupy this unit when maintenance was reported'; end if;
  if v_existing is null then
   select coalesce(sum(case when transaction_type='received' then amount_minor else -amount_minor end),0) into v_balance from public.security_deposit_transactions where lease_id=p_lease_id and organization_id=p_organization_id;
   if p_deduction_minor>v_balance then raise exception 'Deduction exceeds deposit balance'; end if;
   insert into public.security_deposit_transactions(organization_id,lease_id,tenant_id,transaction_type,amount_minor,maintenance_request_id,description,recorded_by) values(p_organization_id,p_lease_id,v_lease.tenant_id,'damage_deduction',p_deduction_minor,p_request_id,coalesce(nullif(trim(p_description),''),'Documented tenant damage'),auth.uid());
  end if;
 end if;
 update public.maintenance_requests set maintenance_cost_minor=p_cost_minor,tenant_damage=p_tenant_damage,responsible_lease_id=case when p_deduction_minor>0 then p_lease_id else null end,deposit_deduction_minor=p_deduction_minor,updated_at=now() where id=p_request_id and organization_id=p_organization_id;
end $$;
