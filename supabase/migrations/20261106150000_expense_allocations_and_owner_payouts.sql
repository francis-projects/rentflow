-- Expense allocation and owner payout tracking.
alter table public.expenses add constraint expenses_id_organization_id_key unique(id,organization_id);
create table public.expense_allocations (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 expense_id uuid not null, property_id uuid not null,
 amount_minor bigint not null check(amount_minor>0), created_at timestamptz not null default now(),
 constraint expense_allocations_expense_fk foreign key(expense_id,organization_id) references public.expenses(id,organization_id) on delete cascade,
 constraint expense_allocations_property_fk foreign key(property_id,organization_id) references public.properties(id,organization_id) on delete restrict,
 constraint expense_allocations_unique_property unique(expense_id,property_id)
);
create index expense_allocations_org_property_idx on public.expense_allocations(organization_id,property_id);
alter table public.expense_allocations enable row level security;
create policy expense_allocations_member_select on public.expense_allocations for select to authenticated using(private.is_org_member(organization_id));
create policy expense_allocations_manager_insert on public.expense_allocations for insert to authenticated with check(private.has_org_role(organization_id,array['owner','admin','manager','accountant']::public.organization_role[]));
create policy expense_allocations_manager_delete on public.expense_allocations for delete to authenticated using(private.has_org_role(organization_id,array['owner','admin','manager','accountant']::public.organization_role[]));
grant select,insert,delete on public.expense_allocations to authenticated;

create function private.enforce_expense_allocation_total()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_total bigint; v_expense bigint; v_status public.expense_status;
begin
 select amount_minor,status into v_expense,v_status from public.expenses where id=new.expense_id and organization_id=new.organization_id for update;
 if not found then raise exception 'Expense not found'; end if;
 if v_status <> 'recorded' then raise exception 'Only recorded expenses can be allocated'; end if;
 select coalesce(sum(amount_minor),0) into v_total from public.expense_allocations where expense_id=new.expense_id and organization_id=new.organization_id and id<>new.id;
 if v_total+new.amount_minor>v_expense then raise exception 'Property allocations cannot exceed the expense amount'; end if;
 return new;
end;
$$;
revoke all on function private.enforce_expense_allocation_total() from public,anon,authenticated;
create trigger expense_allocation_total_guard before insert or update on public.expense_allocations for each row execute function private.enforce_expense_allocation_total();

create table public.owner_payouts (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 owner_id uuid not null, property_id uuid not null,
 amount_minor bigint not null check(amount_minor>0), paid_on date not null,
 payment_method text not null check(payment_method in ('cash','bank_transfer','mobile_money','cheque','other')),
 reference text, notes text, recorded_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
 constraint owner_payouts_owner_fk foreign key(owner_id,organization_id) references public.owners(id,organization_id) on delete restrict,
 constraint owner_payouts_property_fk foreign key(property_id,organization_id) references public.properties(id,organization_id) on delete restrict
);
create index owner_payouts_org_owner_date_idx on public.owner_payouts(organization_id,owner_id,paid_on desc);
alter table public.owner_payouts enable row level security;
create policy owner_payouts_member_select on public.owner_payouts for select to authenticated using(private.is_org_member(organization_id));
create policy owner_payouts_finance_insert on public.owner_payouts for insert to authenticated with check(private.has_org_role(organization_id,array['owner','admin','manager','accountant']::public.organization_role[]));
create policy owner_payouts_admin_update on public.owner_payouts for update to authenticated using(private.has_org_role(organization_id,array['owner','admin']::public.organization_role[])) with check(private.has_org_role(organization_id,array['owner','admin']::public.organization_role[]));
grant select,insert,update on public.owner_payouts to authenticated;

create view public.owner_payout_balances with(security_invoker=true) as
select op.organization_id,op.owner_id,o.full_name owner_name,op.property_id,p.name property_name,sum(op.amount_minor)::bigint total_paid_minor,max(op.paid_on) last_paid_on,count(*)::bigint payout_count
from public.owner_payouts op join public.owners o on o.id=op.owner_id and o.organization_id=op.organization_id
join public.properties p on p.id=op.property_id and p.organization_id=op.organization_id
group by op.organization_id,op.owner_id,o.full_name,op.property_id,p.name;
grant select on public.owner_payout_balances to authenticated;

create or replace view public.owner_monthly_statements with(security_invoker=true) as
with income as (
 select p.organization_id,u.property_id,date_trunc('month',p.received_at at time zone 'Africa/Kampala')::date statement_month,sum(pa.amount_minor)::bigint rent_received_minor
 from public.payment_allocations pa join public.payments p on p.id=pa.payment_id and p.organization_id=pa.organization_id
 join public.rent_charges rc on rc.id=pa.rent_charge_id and rc.organization_id=pa.organization_id
 join public.leases l on l.id=rc.lease_id and l.organization_id=rc.organization_id join public.units u on u.id=l.unit_id and u.organization_id=l.organization_id
 where p.status='posted' group by p.organization_id,u.property_id,date_trunc('month',p.received_at at time zone 'Africa/Kampala')::date
), direct_costs as (
 select e.organization_id,coalesce(e.property_id,u.property_id) property_id,date_trunc('month',e.incurred_on)::date statement_month,sum(e.amount_minor)::bigint expenses_minor
 from public.expenses e left join public.units u on u.id=e.unit_id and u.organization_id=e.organization_id
 where e.status='recorded' and coalesce(e.property_id,u.property_id) is not null
 and not exists(select 1 from public.expense_allocations ea where ea.expense_id=e.id and ea.organization_id=e.organization_id)
 group by e.organization_id,coalesce(e.property_id,u.property_id),date_trunc('month',e.incurred_on)::date
), allocated_costs as (
 select e.organization_id,ea.property_id,date_trunc('month',e.incurred_on)::date statement_month,sum(ea.amount_minor)::bigint expenses_minor
 from public.expense_allocations ea join public.expenses e on e.id=ea.expense_id and e.organization_id=ea.organization_id where e.status='recorded'
 group by e.organization_id,ea.property_id,date_trunc('month',e.incurred_on)::date
), costs as (
 select organization_id,property_id,statement_month,sum(expenses_minor)::bigint expenses_minor from (select * from direct_costs union all select * from allocated_costs) z group by organization_id,property_id,statement_month
), periods as (select organization_id,property_id,statement_month from income union select organization_id,property_id,statement_month from costs)
select po.organization_id,po.owner_id,o.full_name owner_name,po.property_id,pr.name property_name,periods.statement_month,po.ownership_percent,
coalesce(i.rent_received_minor,0)::bigint property_rent_received_minor,coalesce(c.expenses_minor,0)::bigint property_expenses_minor,
round(coalesce(i.rent_received_minor,0)*po.ownership_percent/100)::bigint owner_rent_share_minor,
round(coalesce(c.expenses_minor,0)*po.ownership_percent/100)::bigint owner_expense_share_minor,
(round(coalesce(i.rent_received_minor,0)*po.ownership_percent/100)-round(coalesce(c.expenses_minor,0)*po.ownership_percent/100))::bigint owner_net_minor
from periods join public.property_owners po on po.organization_id=periods.organization_id and po.property_id=periods.property_id
join public.owners o on o.id=po.owner_id and o.organization_id=po.organization_id join public.properties pr on pr.id=po.property_id and pr.organization_id=po.organization_id
left join income i on i.organization_id=periods.organization_id and i.property_id=periods.property_id and i.statement_month=periods.statement_month
left join costs c on c.organization_id=periods.organization_id and c.property_id=periods.property_id and c.statement_month=periods.statement_month;
