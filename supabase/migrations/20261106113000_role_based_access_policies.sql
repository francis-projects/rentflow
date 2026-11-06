-- Role-aware access controls. Membership helper functions are SECURITY DEFINER
-- to avoid RLS recursion when policies need to inspect organization_members.
create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = p_org_id and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.has_org_role(p_org_id uuid, p_roles public.organization_role[])
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = p_org_id
      and m.user_id = (select auth.uid())
      and m.role = any(p_roles)
  );
$$;

revoke all on function public.is_org_member(uuid) from public, anon;
revoke all on function public.has_org_role(uuid,public.organization_role[]) from public, anon;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid,public.organization_role[]) to authenticated;

-- Replace the permissive baseline CRUD policies with explicit role policies.
do $$
declare t text;
begin
  foreach t in array array['properties','units','owners','property_owners','tenants','leases','rent_charges','expenses'] loop
    execute format('drop policy if exists %I on public.%I', t || '_org_member_access', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_org_member(organization_id))', t || '_member_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.has_org_role(organization_id, array[''owner'',''admin'',''manager'']::public.organization_role[]))', t || '_manager_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.has_org_role(organization_id, array[''owner'',''admin'',''manager'']::public.organization_role[])) with check (public.has_org_role(organization_id, array[''owner'',''admin'',''manager'']::public.organization_role[]))', t || '_manager_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.has_org_role(organization_id, array[''owner'',''admin'']::public.organization_role[]))', t || '_admin_delete', t);
  end loop;
end $$;

drop policy if exists payments_org_member_access on public.payments;
create policy payments_member_select on public.payments
for select to authenticated using (public.is_org_member(organization_id));
create policy payments_finance_insert on public.payments
for insert to authenticated with check (public.has_org_role(organization_id, array['owner','admin','manager','accountant']::public.organization_role[]));
-- Payments are immutable through the client API. Reversals require a dedicated
-- audited workflow; do not permit direct updates or deletes.
drop policy if exists payment_allocations_org_member_access on public.payment_allocations;
create policy allocations_member_select on public.payment_allocations
for select to authenticated using (public.is_org_member(organization_id));

-- Workspace members can read their own membership row. Membership management
-- will be provided through an audited owner/admin invitation workflow.
drop policy if exists organization_members_insert_creator on public.organization_members;
