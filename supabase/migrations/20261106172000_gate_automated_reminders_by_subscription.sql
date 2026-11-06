create or replace function private.generate_rent_reminders()
returns integer
language plpgsql
security definer
set search_path=pg_catalog
as $$
declare
  inserted_count integer := 0;
begin
  with reminder_targets as (
    select c.id as charge_id, c.organization_id, l.tenant_id,
      t.full_name as tenant_name, b.balance_minor, c.due_date,
      case
        when c.due_date = (now() at time zone 'Africa/Kampala')::date + 3 then 'rent_due_soon'
        when c.due_date = (now() at time zone 'Africa/Kampala')::date then 'rent_due_today'
        when c.due_date = (now() at time zone 'Africa/Kampala')::date - 1 then 'rent_overdue_1_day'
        when c.due_date = (now() at time zone 'Africa/Kampala')::date - 7 then 'rent_overdue_7_days'
      end as reminder_type
    from public.rent_charge_balances b
    join public.rent_charges c on c.id = b.id and c.organization_id = b.organization_id
    join public.leases l on l.id = c.lease_id and l.organization_id = c.organization_id
    join public.tenants t on t.id = l.tenant_id and t.organization_id = l.organization_id
    join public.organization_subscriptions s on s.organization_id = c.organization_id
    join public.subscription_plans p on p.id = s.plan_id
    where b.balance_minor > 0
      and s.status in ('trialing','active')
      and p.features->>'automated_reminders' = 'true'
      and c.due_date in (
        (now() at time zone 'Africa/Kampala')::date + 3,
        (now() at time zone 'Africa/Kampala')::date,
        (now() at time zone 'Africa/Kampala')::date - 1,
        (now() at time zone 'Africa/Kampala')::date - 7
      )
  ),
  inserted as (
    insert into public.notifications (
      organization_id,user_id,rent_charge_id,notification_type,title,message,scheduled_for
    )
    select r.organization_id,m.user_id,r.charge_id,r.reminder_type,
      case r.reminder_type
        when 'rent_due_soon' then 'Rent due in 3 days'
        when 'rent_due_today' then 'Rent due today'
        when 'rent_overdue_1_day' then 'Rent is 1 day overdue'
        else 'Rent is 7 days overdue'
      end,
      format('%s has an outstanding rent balance of UGX %s. Due date: %s.',
        r.tenant_name,to_char(r.balance_minor,'FM999,999,999,999,990'),
        to_char(r.due_date,'DD Mon YYYY')),
      (now() at time zone 'Africa/Kampala')::date
    from reminder_targets r
    join public.organization_members m on m.organization_id=r.organization_id
    on conflict (user_id,rent_charge_id,notification_type) do nothing
    returning 1
  )
  select count(*) into inserted_count from inserted;
  return inserted_count;
end;
$$;
revoke all on function private.generate_rent_reminders() from public,anon,authenticated;