-- Keep policy helper functions outside the exposed public API schema.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_org_member(p_org_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
 select exists(select 1 from public.organization_members m
 where m.organization_id=p_org_id and m.user_id=(select auth.uid()));
$$;

create or replace function private.has_org_role(p_org_id uuid,p_roles public.organization_role[])
returns boolean language sql stable security definer set search_path = ''
as $$
 select exists(select 1 from public.organization_members m
 where m.organization_id=p_org_id and m.user_id=(select auth.uid()) and m.role=any(p_roles));
$$;

revoke all on function private.is_org_member(uuid) from public, anon;
revoke all on function private.has_org_role(uuid,public.organization_role[]) from public, anon;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.has_org_role(uuid,public.organization_role[]) to authenticated;

do $$
declare t text;
begin
 foreach t in array array['properties','units','owners','property_owners','tenants','leases','rent_charges','expenses'] loop
  execute format('drop policy if exists %I on public.%I',t||'_member_select',t);
  execute format('drop policy if exists %I on public.%I',t||'_manager_insert',t);
  execute format('drop policy if exists %I on public.%I',t||'_manager_update',t);
  execute format('drop policy if exists %I on public.%I',t||'_admin_delete',t);
  execute format('create policy %I on public.%I for select to authenticated using (private.is_org_member(organization_id))',t||'_member_select',t);
  execute format('create policy %I on public.%I for insert to authenticated with check (private.has_org_role(organization_id,array[''owner'',''admin'',''manager'']::public.organization_role[]))',t||'_manager_insert',t);
  execute format('create policy %I on public.%I for update to authenticated using (private.has_org_role(organization_id,array[''owner'',''admin'',''manager'']::public.organization_role[])) with check (private.has_org_role(organization_id,array[''owner'',''admin'',''manager'']::public.organization_role[]))',t||'_manager_update',t);
  execute format('create policy %I on public.%I for delete to authenticated using (private.has_org_role(organization_id,array[''owner'',''admin'']::public.organization_role[]))',t||'_admin_delete',t);
 end loop;
end $$;

drop policy if exists payments_member_select on public.payments;
drop policy if exists payments_finance_insert on public.payments;
create policy payments_member_select on public.payments for select to authenticated using (private.is_org_member(organization_id));
create policy payments_finance_insert on public.payments for insert to authenticated
with check (private.has_org_role(organization_id,array['owner','admin','manager','accountant']::public.organization_role[]));

drop policy if exists allocations_member_select on public.payment_allocations;
create policy allocations_member_select on public.payment_allocations for select to authenticated
using (private.is_org_member(organization_id));

drop function if exists public.is_org_member(uuid);
drop function if exists public.has_org_role(uuid,public.organization_role[]);
