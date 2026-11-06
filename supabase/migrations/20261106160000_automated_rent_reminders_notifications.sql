create extension if not exists pg_cron with schema pg_catalog;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rent_charge_id uuid references public.rent_charges(id) on delete cascade,
  notification_type text not null check (notification_type in ('rent_due_soon','rent_due_today','rent_overdue_1_day','rent_overdue_7_days')),
  title text not null,
  message text not null,
  scheduled_for date not null default (now() at time zone 'Africa/Kampala')::date,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_user_charge_type_key unique (user_id, rent_charge_id, notification_type)
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc) where read_at is null;
create index if not exists notifications_org_created_idx
  on public.notifications (organization_id, created_at desc);

alter table public.notifications enable row level security;
grant select, update on public.notifications to authenticated;

create policy "Users can view their own notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can mark their own notifications read"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create or replace function private.generate_rent_reminders()
returns integer
language plpgsql
security definer
set search_path = pg_catalog
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
    where b.balance_minor > 0
      and c.due_date in (
        (now() at time zone 'Africa/Kampala')::date + 3,
        (now() at time zone 'Africa/Kampala')::date,
        (now() at time zone 'Africa/Kampala')::date - 1,
        (now() at time zone 'Africa/Kampala')::date - 7
      )
  ),
  inserted as (
    insert into public.notifications (
      organization_id, user_id, rent_charge_id, notification_type,
      title, message, scheduled_for
    )
    select r.organization_id, m.user_id, r.charge_id, r.reminder_type,
      case r.reminder_type
        when 'rent_due_soon' then 'Rent due in 3 days'
        when 'rent_due_today' then 'Rent due today'
        when 'rent_overdue_1_day' then 'Rent is 1 day overdue'
        else 'Rent is 7 days overdue'
      end,
      format('%s has an outstanding rent balance of UGX %s. Due date: %s.',
        r.tenant_name, to_char(r.balance_minor, 'FM999,999,999,999,990'),
        to_char(r.due_date, 'DD Mon YYYY')),
      (now() at time zone 'Africa/Kampala')::date
    from reminder_targets r
    join public.organization_members m on m.organization_id = r.organization_id
    on conflict (user_id, rent_charge_id, notification_type) do nothing
    returning 1
  )
  select count(*) into inserted_count from inserted;
  return inserted_count;
end;
$$;

revoke all on function private.generate_rent_reminders() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'rentflow-daily-rent-reminders') then
    perform cron.unschedule('rentflow-daily-rent-reminders');
  end if;
  perform cron.schedule('rentflow-daily-rent-reminders', '0 4 * * *',
    'select private.generate_rent_reminders();');
end;
$$;