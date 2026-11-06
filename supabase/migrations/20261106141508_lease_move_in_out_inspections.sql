create table public.lease_inspections (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete restrict,
 lease_id uuid not null,
 inspection_type text not null check (inspection_type in ('move_in','move_out')),
 condition_notes text not null,
 inventory_notes text not null default '',
 damage_notes text not null default '',
 completed boolean not null default false,
 inspected_by uuid not null references auth.users(id),
 inspected_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 foreign key (lease_id,organization_id) references public.leases(id,organization_id) on delete restrict
);
create index lease_inspections_lease_type_idx on public.lease_inspections(organization_id,lease_id,inspection_type,inspected_at desc);
alter table public.lease_inspections enable row level security;
create policy lease_inspections_org_select on public.lease_inspections for select to authenticated using(private.is_org_member(organization_id));
create policy lease_inspections_org_insert on public.lease_inspections for insert to authenticated with check(inspected_by=(select auth.uid()) and private.has_org_role(organization_id,array['owner','admin','manager','staff']::public.organization_role[]));
create policy lease_inspections_org_update on public.lease_inspections for update to authenticated using(private.has_org_role(organization_id,array['owner','admin','manager','staff']::public.organization_role[])) with check(private.has_org_role(organization_id,array['owner','admin','manager','staff']::public.organization_role[]));
create or replace function private.protect_completed_lease_inspection() returns trigger language plpgsql set search_path='' as $$
begin
 if old.completed then raise exception 'Completed inspections are locked; create a new inspection record to preserve the audit trail'; end if;
 if new.organization_id<>old.organization_id or new.lease_id<>old.lease_id or new.inspection_type<>old.inspection_type or new.inspected_by<>old.inspected_by then raise exception 'Inspection identity cannot be changed'; end if;
 return new;
end $$;
create trigger lease_inspection_lock_completed before update on public.lease_inspections for each row execute function private.protect_completed_lease_inspection();
grant select,insert,update on public.lease_inspections to authenticated;