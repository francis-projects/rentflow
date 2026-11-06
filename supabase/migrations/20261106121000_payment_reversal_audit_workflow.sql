-- Auditable payment reversals. Posted payments are never deleted.
create table if not exists public.payment_reversals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  payment_id uuid not null,
  reason text not null check (length(trim(reason)) between 5 and 500),
  reversed_by uuid not null references auth.users(id),
  reversed_at timestamptz not null default now(),
  constraint payment_reversals_payment_org_fk foreign key (payment_id, organization_id)
    references public.payments(id, organization_id),
  constraint payment_reversals_payment_unique unique (payment_id)
);
alter table public.payment_reversals enable row level security;
create policy payment_reversals_member_select on public.payment_reversals
  for select to authenticated using (private.is_org_member(organization_id));

create or replace function public.reverse_rent_payment(
  p_organization_id uuid, p_payment_id uuid, p_reason text
) returns void language plpgsql security definer set search_path = ''
as $$
declare v_payment public.payments%rowtype; v_charge record; v_paid bigint;
begin
  if auth.uid() is null or not private.has_org_role(p_organization_id,
    array['owner','admin','manager','accountant']::public.organization_role[]) then
    raise exception 'Not authorised to reverse payments';
  end if;
  if length(trim(coalesce(p_reason,''))) < 5 or length(trim(p_reason)) > 500 then
    raise exception 'Provide a reversal reason between 5 and 500 characters';
  end if;
  select * into v_payment from public.payments
    where id=p_payment_id and organization_id=p_organization_id for update;
  if not found then raise exception 'Payment not found'; end if;
  if v_payment.status <> 'posted' then raise exception 'Only posted payments can be reversed'; end if;
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
revoke all on function public.reverse_rent_payment(uuid,uuid,text) from public, anon;
grant execute on function public.reverse_rent_payment(uuid,uuid,text) to authenticated;
