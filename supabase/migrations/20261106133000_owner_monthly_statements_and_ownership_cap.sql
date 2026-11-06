-- Enforce a 100% ownership cap per property and expose cash-basis owner statements.
create or replace function private.enforce_property_ownership_cap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total numeric(7,2);
begin
  perform 1 from public.properties
   where id = new.property_id and organization_id = new.organization_id
   for update;

  select coalesce(sum(ownership_percent),0)
    into v_total
    from public.property_owners
   where property_id = new.property_id
     and organization_id = new.organization_id
     and (tg_op = 'INSERT' or id <> new.id);

  if v_total + new.ownership_percent > 100.00 then
    raise exception 'Combined ownership for a property cannot exceed 100%%';
  end if;
  return new;
end;
$$;

drop trigger if exists property_ownership_cap on public.property_owners;
create trigger property_ownership_cap
before insert or update of ownership_percent, property_id, organization_id
on public.property_owners
for each row execute function private.enforce_property_ownership_cap();

create or replace view public.owner_monthly_statements
with (security_invoker = true)
as
with income as (
  select p.organization_id,
         u.property_id,
         date_trunc('month', p.received_at at time zone 'Africa/Kampala')::date as statement_month,
         sum(pa.amount_minor)::bigint as rent_received_minor
    from public.payment_allocations pa
    join public.payments p on p.id = pa.payment_id and p.organization_id = pa.organization_id
    join public.rent_charges rc on rc.id = pa.rent_charge_id and rc.organization_id = pa.organization_id
    join public.leases l on l.id = rc.lease_id and l.organization_id = rc.organization_id
    join public.units u on u.id = l.unit_id and u.organization_id = l.organization_id
   where p.status = 'posted'
   group by p.organization_id, u.property_id,
            date_trunc('month', p.received_at at time zone 'Africa/Kampala')::date
),
costs as (
  select e.organization_id,
         coalesce(e.property_id, u.property_id) as property_id,
         date_trunc('month', e.incurred_on)::date as statement_month,
         sum(e.amount_minor)::bigint as expenses_minor
    from public.expenses e
    left join public.units u on u.id = e.unit_id and u.organization_id = e.organization_id
   where e.status = 'recorded'
     and coalesce(e.property_id, u.property_id) is not null
   group by e.organization_id, coalesce(e.property_id, u.property_id),
            date_trunc('month', e.incurred_on)::date
),
periods as (
  select organization_id, property_id, statement_month from income
  union
  select organization_id, property_id, statement_month from costs
)
select po.organization_id,
       po.owner_id,
       o.full_name as owner_name,
       po.property_id,
       pr.name as property_name,
       periods.statement_month,
       po.ownership_percent,
       coalesce(i.rent_received_minor,0)::bigint as property_rent_received_minor,
       coalesce(c.expenses_minor,0)::bigint as property_expenses_minor,
       round(coalesce(i.rent_received_minor,0) * po.ownership_percent / 100)::bigint as owner_rent_share_minor,
       round(coalesce(c.expenses_minor,0) * po.ownership_percent / 100)::bigint as owner_expense_share_minor,
       (round(coalesce(i.rent_received_minor,0) * po.ownership_percent / 100)
        - round(coalesce(c.expenses_minor,0) * po.ownership_percent / 100))::bigint as owner_net_minor
  from periods
  join public.property_owners po
    on po.organization_id = periods.organization_id
   and po.property_id = periods.property_id
  join public.owners o
    on o.id = po.owner_id and o.organization_id = po.organization_id
  join public.properties pr
    on pr.id = po.property_id and pr.organization_id = po.organization_id
  left join income i
    on i.organization_id = periods.organization_id
   and i.property_id = periods.property_id
   and i.statement_month = periods.statement_month
  left join costs c
    on c.organization_id = periods.organization_id
   and c.property_id = periods.property_id
   and c.statement_month = periods.statement_month;

grant select on public.owner_monthly_statements to authenticated;
