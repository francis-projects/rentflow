-- Preserve maintenance history when a unit is removed by clearing only unit_id.
alter table public.maintenance_requests drop constraint if exists maintenance_unit_org_fk;
alter table public.maintenance_requests add constraint maintenance_unit_org_fk foreign key (unit_id, organization_id) references public.units(id, organization_id) on delete set null (unit_id);
