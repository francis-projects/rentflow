-- Keep the PostgREST RPC names stable while moving privileged implementations
-- out of the exposed public schema. Public wrappers run as invokers.
create schema if not exists private;
grant usage on schema private to authenticated;
revoke all on schema private from anon;

create or replace function private.record_rent_payment(
  p_organization_id uuid,
  p_tenant_id uuid,
  p_lease_id uuid,
  p_amount_minor bigint,
  p_payment_method public.payment_method,
  p_payment_reference text default null,
  p_received_at timestamptz default now(),
  p_notes text default null,
  p_allocations jsonb default '[]'::jsonb
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_payment_id uuid;
  v_allocation record;
  v_total_allocated bigint := 0;
  v_charge_amount bigint;
  v_paid_amount bigint;
begin
  if auth.uid() is null or not exists (
    select 1 from public.organization_members m
    where m.organization_id = p_organization_id and m.user_id = auth.uid()
  ) then raise exception 'Not authorised for this organisation'; end if;
  if p_amount_minor <= 0 then raise exception 'Payment amount must be positive'; end if;
  if not exists (select 1 from public.tenants t where t.id=p_tenant_id and t.organization_id=p_organization_id)
    then raise exception 'Tenant does not belong to this organisation'; end if;
  if p_lease_id is not null and not exists (
    select 1 from public.leases l where l.id=p_lease_id and l.organization_id=p_organization_id and l.tenant_id=p_tenant_id
  ) then raise exception 'Lease does not belong to this tenant and organisation'; end if;
  insert into public.payments (
    organization_id,tenant_id,lease_id,amount_minor,payment_method,payment_reference,received_at,recorded_by,notes
  ) values (
    p_organization_id,p_tenant_id,p_lease_id,p_amount_minor,p_payment_method,
    nullif(trim(coalesce(p_payment_reference,'')),''),p_received_at,auth.uid(),p_notes
  ) returning id into v_payment_id;
  for v_allocation in
    select (x->>'rent_charge_id')::uuid as rent_charge_id,(x->>'amount_minor')::bigint as amount_minor
    from jsonb_array_elements(coalesce(p_allocations,'[]'::jsonb)) x
  loop
    if v_allocation.amount_minor<=0 then raise exception 'Allocation must be positive'; end if;
    if not exists (
      select 1 from public.rent_charges rc
      join public.leases l on l.id=rc.lease_id and l.organization_id=rc.organization_id
      where rc.id=v_allocation.rent_charge_id and rc.organization_id=p_organization_id
        and l.tenant_id=p_tenant_id and (p_lease_id is null or rc.lease_id=p_lease_id)
      for update of rc
    ) then raise exception 'Rent charge is not valid for this tenant'; end if;
    select rc.amount_minor into v_charge_amount from public.rent_charges rc
      where rc.id=v_allocation.rent_charge_id for update;
    select coalesce(sum(pa.amount_minor),0) into v_paid_amount
      from public.payment_allocations pa join public.payments p
        on p.id=pa.payment_id and p.organization_id=pa.organization_id
      where pa.rent_charge_id=v_allocation.rent_charge_id and p.status='posted';
    if v_paid_amount+v_allocation.amount_minor>v_charge_amount
      then raise exception 'Allocation exceeds outstanding charge balance'; end if;
    insert into public.payment_allocations(organization_id,payment_id,rent_charge_id,amount_minor)
      values(p_organization_id,v_payment_id,v_allocation.rent_charge_id,v_allocation.amount_minor);
    v_total_allocated:=v_total_allocated+v_allocation.amount_minor;
    update public.rent_charges set status=case
      when v_paid_amount+v_allocation.amount_minor>=v_charge_amount then 'paid'::public.charge_status
      else 'partially_paid'::public.charge_status end
      where id=v_allocation.rent_charge_id;
  end loop;
  if v_total_allocated>p_amount_minor then raise exception 'Allocations exceed payment amount'; end if;
  return v_payment_id;
end;
$$;

create or replace function private.generate_monthly_rent_charges(
  p_organization_id uuid,p_period date
) returns integer
language plpgsql security definer set search_path = ''
as $$
declare v_count integer;
begin
  if auth.uid() is null or not exists (
    select 1 from public.organization_members m
    where m.organization_id=p_organization_id and m.user_id=auth.uid()
  ) then raise exception 'Not authorised for this organisation'; end if;
  insert into public.rent_charges(organization_id,lease_id,charge_period,amount_minor,due_date)
  select l.organization_id,l.id,date_trunc('month',p_period)::date,l.rent_amount_minor,
    (date_trunc('month',p_period)::date+(l.due_day-1))
  from public.leases l
  where l.organization_id=p_organization_id and l.status='active'
    and l.start_date<=(date_trunc('month',p_period)+interval '1 month - 1 day')::date
    and (l.end_date is null or l.end_date>=date_trunc('month',p_period)::date)
  on conflict(lease_id,charge_period) do nothing;
  get diagnostics v_count=row_count;
  return v_count;
end;
$$;

create or replace function private.reverse_rent_payment(
  p_organization_id uuid,p_payment_id uuid,p_reason text
) returns void
language plpgsql security definer set search_path = ''
as $$
declare v_payment public.payments%rowtype; v_charge record; v_paid bigint;
begin
  if auth.uid() is null or not private.has_org_role(
    p_organization_id,array['owner','admin','manager','accountant']::public.organization_role[]
  ) then raise exception 'Not authorised to reverse payments'; end if;
  if length(trim(coalesce(p_reason,'')))<5 or length(trim(p_reason))>500
    then raise exception 'Provide a reversal reason between 5 and 500 characters'; end if;
  select * into v_payment from public.payments
    where id=p_payment_id and organization_id=p_organization_id for update;
  if not found then raise exception 'Payment not found'; end if;
  if v_payment.status<>'posted' then raise exception 'Only posted payments can be reversed'; end if;
  insert into public.payment_reversals(organization_id,payment_id,reason,reversed_by)
    values(p_organization_id,p_payment_id,trim(p_reason));
  update public.payments set status='reversed'
    where id=p_payment_id and organization_id=p_organization_id;
  for v_charge in select distinct rent_charge_id from public.payment_allocations
    where payment_id=p_payment_id and organization_id=p_organization_id
  loop
    select coalesce(sum(pa.amount_minor),0) into v_paid
    from public.payment_allocations pa join public.payments p
      on p.id=pa.payment_id and p.organization_id=pa.organization_id
    where pa.rent_charge_id=v_charge.rent_charge_id and p.status='posted';
    update public.rent_charges set status=case
      when v_paid=0 then 'open'::public.charge_status
      when v_paid>=amount_minor then 'paid'::public.charge_status
      else 'partially_paid'::public.charge_status end
    where id=v_charge.rent_charge_id and organization_id=p_organization_id;
  end loop;
end;
$$;

revoke all on function private.record_rent_payment(uuid,uuid,uuid,bigint,public.payment_method,text,timestamptz,text,jsonb) from public,anon;
revoke all on function private.generate_monthly_rent_charges(uuid,date) from public,anon;
revoke all on function private.reverse_rent_payment(uuid,uuid,text) from public,anon;
grant execute on function private.record_rent_payment(uuid,uuid,uuid,bigint,public.payment_method,text,timestamptz,text,jsonb) to authenticated;
grant execute on function private.generate_monthly_rent_charges(uuid,date) to authenticated;
grant execute on function private.reverse_rent_payment(uuid,uuid,text) to authenticated;

create or replace function public.record_rent_payment(
  p_organization_id uuid,p_tenant_id uuid,p_lease_id uuid,p_amount_minor bigint,
  p_payment_method public.payment_method,p_payment_reference text default null,
  p_received_at timestamptz default now(),p_notes text default null,p_allocations jsonb default '[]'::jsonb
) returns uuid language sql security invoker set search_path = ''
as $$ select private.record_rent_payment($1,$2,$3,$4,$5,$6,$7,$8,$9); $$;

create or replace function public.generate_monthly_rent_charges(
  p_organization_id uuid,p_period date
) returns integer language sql security invoker set search_path = ''
as $$ select private.generate_monthly_rent_charges($1,$2); $$;

create or replace function public.reverse_rent_payment(
  p_organization_id uuid,p_payment_id uuid,p_reason text
) returns void language sql security invoker set search_path = ''
as $$ select private.reverse_rent_payment($1,$2,$3); $$;

revoke all on function public.record_rent_payment(uuid,uuid,uuid,bigint,public.payment_method,text,timestamptz,text,jsonb) from public,anon;
revoke all on function public.generate_monthly_rent_charges(uuid,date) from public,anon;
revoke all on function public.reverse_rent_payment(uuid,uuid,text) from public,anon;
grant execute on function public.record_rent_payment(uuid,uuid,uuid,bigint,public.payment_method,text,timestamptz,text,jsonb) to authenticated;
grant execute on function public.generate_monthly_rent_charges(uuid,date) to authenticated;
grant execute on function public.reverse_rent_payment(uuid,uuid,text) to authenticated;
