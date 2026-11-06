create table if not exists public.maintenance_requests (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 property_id uuid not null,
 unit_id uuid,
 title text not null check (length(trim(title)) between 3 and 160),
 description text,
 category text not null default 'general',
 priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
 status text not null default 'open' check (status in ('open','in_progress','waiting','completed','cancelled')),
 reported_by uuid not null references auth.users(id),
 assigned_to uuid references auth.users(id),
 reported_at timestamptz not null default now(),
 due_date date,
 completed_at timestamptz,
 updated_at timestamptz not null default now(),
 constraint maintenance_property_org_fk foreign key(property_id,organization_id) references public.properties(id,organization_id) on delete cascade,
 constraint maintenance_unit_org_fk foreign key(unit_id,organization_id) references public.units(id,organization_id) on delete set null (unit_id)
);
create index if not exists maintenance_org_status_idx on public.maintenance_requests(organization_id,status,reported_at desc);
create index if not exists maintenance_property_idx on public.maintenance_requests(property_id,organization_id);
alter table public.maintenance_requests enable row level security;
create policy maintenance_member_select on public.maintenance_requests for select to authenticated using (private.is_org_member(organization_id));
create policy maintenance_manager_insert on public.maintenance_requests for insert to authenticated with check (private.has_org_role(organization_id,array['owner','admin','manager','staff']::public.organization_role[]) and reported_by=(select auth.uid()));
create policy maintenance_manager_update on public.maintenance_requests for update to authenticated using (private.has_org_role(organization_id,array['owner','admin','manager']::public.organization_role[])) with check (private.has_org_role(organization_id,array['owner','admin','manager']::public.organization_role[]));
create policy maintenance_admin_delete on public.maintenance_requests for delete to authenticated using (private.has_org_role(organization_id,array['owner','admin']::public.organization_role[]));
grant select,insert,update,delete on public.maintenance_requests to authenticated;
