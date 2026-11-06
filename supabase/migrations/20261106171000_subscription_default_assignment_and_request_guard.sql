create or replace function private.assign_default_free_subscription()
returns trigger
language plpgsql
security definer
set search_path=pg_catalog
as $$
begin
  insert into public.organization_subscriptions (organization_id,plan_id,status)
  select new.id,p.id,'active'
  from public.subscription_plans p
  where p.code='free'
  on conflict (organization_id) do nothing;
  return new;
end;
$$;

revoke all on function private.assign_default_free_subscription() from public,anon,authenticated;

drop trigger if exists organizations_assign_free_subscription on public.organizations;
create trigger organizations_assign_free_subscription
after insert on public.organizations
for each row execute function private.assign_default_free_subscription();

create unique index if not exists one_pending_subscription_request_per_org
on public.subscription_change_requests(organization_id)
where status='pending';

update public.subscription_plans
set features=features || jsonb_build_object('owner_payouts', code <> 'free');
