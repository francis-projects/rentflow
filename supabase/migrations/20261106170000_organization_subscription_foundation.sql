create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('free','starter','professional','enterprise')),
  name text not null,
  description text not null,
  monthly_price_minor bigint,
  annual_price_minor bigint,
  currency_code char(3) not null default 'UGX',
  max_properties integer,
  max_units integer,
  max_team_members integer,
  features jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint subscription_plan_prices_nonnegative check (
    (monthly_price_minor is null or monthly_price_minor >= 0) and
    (annual_price_minor is null or annual_price_minor >= 0)
  )
);
insert into public.subscription_plans
(code,name,description,monthly_price_minor,annual_price_minor,max_properties,max_units,max_team_members,features,sort_order)
values
('free','Free','Core tools to organise a small rental portfolio',0,0,1,5,1,'{"rent_ledger":true,"tenant_documents":false,"maintenance":true,"owner_statements":false,"financial_exports":false,"team_management":false,"automated_reminders":false,"ai_insights":false}'::jsonb,1),
('starter','Starter','For independent landlords growing their portfolio',null,null,5,30,3,'{"rent_ledger":true,"tenant_documents":true,"maintenance":true,"owner_statements":true,"financial_exports":true,"team_management":true,"automated_reminders":true,"ai_insights":false}'::jsonb,2),
('professional','Professional','For property managers handling multiple properties and teams',null,null,25,200,10,'{"rent_ledger":true,"tenant_documents":true,"maintenance":true,"owner_statements":true,"financial_exports":true,"team_management":true,"automated_reminders":true,"ai_insights":true}'::jsonb,3),
('enterprise','Enterprise','For larger portfolios and property management organisations',null,null,null,null,null,'{"rent_ledger":true,"tenant_documents":true,"maintenance":true,"owner_statements":true,"financial_exports":true,"team_management":true,"automated_reminders":true,"ai_insights":true,"priority_support":true}'::jsonb,4)
on conflict (code) do update set name=excluded.name,description=excluded.description,max_properties=excluded.max_properties,max_units=excluded.max_units,max_team_members=excluded.max_team_members,features=excluded.features,sort_order=excluded.sort_order;
create table if not exists public.organization_subscriptions (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null unique references public.organizations(id) on delete cascade,
 plan_id uuid not null references public.subscription_plans(id),
 status text not null default 'active' check (status in ('trialing','active','past_due','cancelled','paused')),
 billing_interval text not null default 'monthly' check (billing_interval in ('monthly','annual')),
 started_at timestamptz not null default now(),
 current_period_start timestamptz not null default now(),
 current_period_end timestamptz,
 trial_ends_at timestamptz,
 cancelled_at timestamptz,
 provider text,
 provider_customer_id text,
 provider_subscription_id text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.subscription_change_requests (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 requested_plan_id uuid not null references public.subscription_plans(id),
 requested_by uuid not null references auth.users(id),
 billing_interval text not null default 'monthly' check (billing_interval in ('monthly','annual')),
 status text not null default 'pending' check (status in ('pending','approved','rejected','withdrawn')),
 notes text, reviewed_by uuid references auth.users(id), reviewed_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists organization_subscriptions_plan_idx on public.organization_subscriptions(plan_id);
create index if not exists subscription_change_requests_org_created_idx on public.subscription_change_requests(organization_id,created_at desc);
insert into public.organization_subscriptions(organization_id,plan_id,status)
select o.id,p.id,'active' from public.organizations o cross join public.subscription_plans p
where p.code='free' on conflict (organization_id) do nothing;
alter table public.subscription_plans enable row level security;
alter table public.organization_subscriptions enable row level security;
alter table public.subscription_change_requests enable row level security;
grant select on public.subscription_plans,public.organization_subscriptions,public.subscription_change_requests to authenticated;
grant insert on public.subscription_change_requests to authenticated;
create policy "Authenticated users can view active subscription plans" on public.subscription_plans for select to authenticated using (is_active=true);
create policy "Workspace members can view their subscription" on public.organization_subscriptions for select to authenticated using (private.is_org_member(organization_id));
create policy "Workspace members can view subscription requests" on public.subscription_change_requests for select to authenticated using (private.is_org_member(organization_id));
create policy "Workspace owners and admins can request plan changes" on public.subscription_change_requests for insert to authenticated with check (requested_by=(select auth.uid()) and private.has_org_role(organization_id,array['owner','admin']::public.organization_role[]));
create or replace function private.set_subscription_updated_at() returns trigger language plpgsql set search_path=pg_catalog as $$ begin new.updated_at=now(); return new; end; $$;
create trigger organization_subscriptions_updated_at before update on public.organization_subscriptions for each row execute function private.set_subscription_updated_at();
revoke all on public.subscription_plans from anon;
revoke all on public.organization_subscriptions from anon;
revoke all on public.subscription_change_requests from anon;