-- Historical baseline RLS policy snapshot. Current role-aware policies are
-- maintained in the versioned migration files under supabase/migrations/.

-- A user can read an organisation if they created it or are a member.
create policy "organizations_select_member_or_creator"
on public.organizations for select to authenticated
using (
  created_by = (select auth.uid())
  or exists (
    select 1 from public.organization_members m
    where m.organization_id = organizations.id
      and m.user_id = (select auth.uid())
  )
);

create policy "organizations_insert_creator"
on public.organizations for insert to authenticated
with check (created_by = (select auth.uid()));

create policy "organizations_update_creator"
on public.organizations for update to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

-- Membership bootstrap: a user can create the first membership only for an
-- organisation they created. Existing users can read their own membership.
create policy "organization_members_select_self"
on public.organization_members for select to authenticated
using (user_id = (select auth.uid()));

create policy "organization_members_insert_creator"
on public.organization_members for insert to authenticated
with check (
  exists (
    select 1 from public.organizations o
    where o.id = organization_members.organization_id
      and o.created_by = (select auth.uid())
  )
  and (
    user_id = (select auth.uid())
    and role = 'owner'
  )
);

-- Every tenant-owned business table is scoped by an organisation membership.
-- These baseline policies grant CRUD to members. Role-specific permissions
-- (e.g. staff cannot reverse payments) will be layered on in the permissions
-- pass, and critical financial actions will use audited database operations.
create policy "properties_org_member_access"
on public.properties for all to authenticated
using (exists (
  select 1 from public.organization_members m
  where m.organization_id = properties.organization_id
    and m.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.organization_members m
  where m.organization_id = properties.organization_id
    and m.user_id = (select auth.uid())
));

create policy "units_org_member_access"
on public.units for all to authenticated
using (exists (
  select 1 from public.organization_members m
  where m.organization_id = units.organization_id
    and m.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.organization_members m
  where m.organization_id = units.organization_id
    and m.user_id = (select auth.uid())
));

create policy "owners_org_member_access"
on public.owners for all to authenticated
using (exists (
  select 1 from public.organization_members m
  where m.organization_id = owners.organization_id
    and m.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.organization_members m
  where m.organization_id = owners.organization_id
    and m.user_id = (select auth.uid())
));

create policy "property_owners_org_member_access"
on public.property_owners for all to authenticated
using (exists (
  select 1 from public.organization_members m
  where m.organization_id = property_owners.organization_id
    and m.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.organization_members m
  where m.organization_id = property_owners.organization_id
    and m.user_id = (select auth.uid())
));

create policy "tenants_org_member_access"
on public.tenants for all to authenticated
using (exists (
  select 1 from public.organization_members m
  where m.organization_id = tenants.organization_id
    and m.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.organization_members m
  where m.organization_id = tenants.organization_id
    and m.user_id = (select auth.uid())
));

create policy "leases_org_member_access"
on public.leases for all to authenticated
using (exists (
  select 1 from public.organization_members m
  where m.organization_id = leases.organization_id
    and m.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.organization_members m
  where m.organization_id = leases.organization_id
    and m.user_id = (select auth.uid())
));

create policy "rent_charges_org_member_access"
on public.rent_charges for all to authenticated
using (exists (
  select 1 from public.organization_members m
  where m.organization_id = rent_charges.organization_id
    and m.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.organization_members m
  where m.organization_id = rent_charges.organization_id
    and m.user_id = (select auth.uid())
));

create policy "payments_org_member_access"
on public.payments for all to authenticated
using (exists (
  select 1 from public.organization_members m
  where m.organization_id = payments.organization_id
    and m.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.organization_members m
  where m.organization_id = payments.organization_id
    and m.user_id = (select auth.uid())
));

create policy "payment_allocations_org_member_access"
on public.payment_allocations for all to authenticated
using (exists (
  select 1 from public.organization_members m
  where m.organization_id = payment_allocations.organization_id
    and m.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.organization_members m
  where m.organization_id = payment_allocations.organization_id
    and m.user_id = (select auth.uid())
));

create policy "expenses_org_member_access"
on public.expenses for all to authenticated
using (exists (
  select 1 from public.organization_members m
  where m.organization_id = expenses.organization_id
    and m.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.organization_members m
  where m.organization_id = expenses.organization_id
    and m.user_id = (select auth.uid())
));
