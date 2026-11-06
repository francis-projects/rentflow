-- Enforce one active lease per unit, including concurrent requests.
create unique index if not exists leases_one_active_per_unit
on public.leases(unit_id)
where status = 'active';

create or replace function public.sync_unit_occupancy()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.status = 'active' then
      update public.units
      set status = case when exists (
        select 1 from public.leases l
        where l.unit_id = old.unit_id and l.status = 'active' and l.id <> old.id
      ) then 'occupied'::public.unit_status else 'vacant'::public.unit_status end
      where id = old.unit_id and organization_id = old.organization_id;
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' and old.unit_id is distinct from new.unit_id and old.status = 'active' then
    update public.units set status = 'vacant'::public.unit_status
    where id = old.unit_id and organization_id = old.organization_id
      and not exists (select 1 from public.leases l where l.unit_id=old.unit_id and l.status='active' and l.id<>old.id);
  end if;

  if new.status = 'active' then
    update public.units set status = 'occupied'::public.unit_status
    where id = new.unit_id and organization_id = new.organization_id;
  elsif tg_op = 'UPDATE' and old.status = 'active' then
    update public.units set status = 'vacant'::public.unit_status
    where id = new.unit_id and organization_id = new.organization_id
      and not exists (select 1 from public.leases l where l.unit_id=new.unit_id and l.status='active' and l.id<>new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists leases_sync_unit_occupancy on public.leases;
create trigger leases_sync_unit_occupancy
after insert or update or delete on public.leases
for each row execute function public.sync_unit_occupancy();
revoke all on function public.sync_unit_occupancy() from public, anon, authenticated;

-- Secure view of outstanding rent using posted payment allocations.
create or replace view public.rent_charge_balances
with (security_invoker = true)
as
select
  rc.id,
  rc.organization_id,
  rc.lease_id,
  rc.charge_period,
  rc.description,
  rc.amount_minor,
  rc.due_date,
  rc.status,
  coalesce(sum(case when p.status = 'posted' then pa.amount_minor else 0 end), 0)::bigint as paid_minor,
  greatest(rc.amount_minor - coalesce(sum(case when p.status = 'posted' then pa.amount_minor else 0 end), 0), 0)::bigint as balance_minor
from public.rent_charges rc
left join public.payment_allocations pa on pa.rent_charge_id = rc.id and pa.organization_id = rc.organization_id
left join public.payments p on p.id = pa.payment_id and p.organization_id = pa.organization_id
group by rc.id;
