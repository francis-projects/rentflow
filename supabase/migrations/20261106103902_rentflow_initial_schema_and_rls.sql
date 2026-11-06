-- RentFlow initial PostgreSQL schema (Supabase-compatible).
-- This is a reviewed schema draft, not yet an applied migration.
-- Apply only to a disposable development database after review.

create extension if not exists pgcrypto;

create type public.organization_role as enum ('owner', 'admin', 'manager', 'accountant', 'staff');
create type public.unit_status as enum ('vacant', 'occupied', 'maintenance', 'inactive');
create type public.lease_status as enum ('draft', 'active', 'ended', 'terminated');
create type public.charge_status as enum ('open', 'partially_paid', 'paid', 'void');
create type public.payment_method as enum ('cash', 'bank_transfer', 'mobile_money', 'cheque', 'other');
create type public.payment_status as enum ('posted', 'reversed');
create type public.expense_status as enum ('recorded', 'void');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 140),
  country_code char(2) not null default 'UG',
  currency_code char(3) not null default 'UGX',
  timezone text not null default 'Africa/Kampala',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_role not null default 'staff',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id),
  unique (id, organization_id)
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name text not null,
  property_type text not null default 'residential',
  address_line text,
  district text,
  city text,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id)
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  property_id uuid not null,
  unit_code text not null,
  floor_label text,
  bedrooms smallint check (bedrooms is null or bedrooms >= 0),
  bathrooms numeric(3,1) check (bathrooms is null or bathrooms >= 0),
  monthly_rent_minor bigint not null default 0 check (monthly_rent_minor >= 0),
  status public.unit_status not null default 'vacant',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, unit_code),
  unique (id, organization_id),
  foreign key (property_id, organization_id) references public.properties(id, organization_id) on delete restrict
);

create table public.owners (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  full_name text not null,
  email text,
  phone text,
  postal_address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id)
);

create table public.property_owners (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  property_id uuid not null,
  owner_id uuid not null,
  ownership_percent numeric(5,2) not null check (ownership_percent > 0 and ownership_percent <= 100),
  created_at timestamptz not null default now(),
  foreign key (property_id, organization_id) references public.properties(id, organization_id) on delete cascade,
  foreign key (owner_id, organization_id) references public.owners(id, organization_id) on delete restrict,
  unique (property_id, owner_id)
);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  full_name text not null,
  email text,
  phone text,
  national_id_last4 text,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id)
);

create table public.leases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  unit_id uuid not null,
  tenant_id uuid not null,
  lease_reference text,
  start_date date not null,
  end_date date,
  rent_amount_minor bigint not null check (rent_amount_minor >= 0),
  deposit_amount_minor bigint not null default 0 check (deposit_amount_minor >= 0),
  due_day smallint not null default 1 check (due_day between 1 and 28),
  status public.lease_status not null default 'draft',
  terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date),
  unique (id, organization_id),
  foreign key (unit_id, organization_id) references public.units(id, organization_id) on delete restrict,
  foreign key (tenant_id, organization_id) references public.tenants(id, organization_id) on delete restrict
);

create table public.rent_charges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  lease_id uuid not null,
  charge_period date not null,
  description text not null default 'Monthly rent',
  amount_minor bigint not null check (amount_minor > 0),
  status public.charge_status not null default 'open',
  due_date date not null,
  created_at timestamptz not null default now(),
  unique (lease_id, charge_period),
  unique (id, organization_id),
  foreign key (lease_id, organization_id) references public.leases(id, organization_id) on delete restrict
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  tenant_id uuid not null,
  lease_id uuid,
  amount_minor bigint not null check (amount_minor > 0),
  currency_code char(3) not null default 'UGX',
  payment_method public.payment_method not null,
  payment_reference text,
  received_at timestamptz not null default now(),
  status public.payment_status not null default 'posted',
  recorded_by uuid not null references auth.users(id) on delete restrict,
  notes text,
  created_at timestamptz not null default now(),
  unique (id, organization_id),
  foreign key (tenant_id, organization_id) references public.tenants(id, organization_id) on delete restrict,
  foreign key (lease_id, organization_id) references public.leases(id, organization_id) on delete restrict
);

create table public.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  payment_id uuid not null,
  rent_charge_id uuid not null,
  amount_minor bigint not null check (amount_minor > 0),
  created_at timestamptz not null default now(),
  foreign key (payment_id, organization_id) references public.payments(id, organization_id) on delete restrict,
  foreign key (rent_charge_id, organization_id) references public.rent_charges(id, organization_id) on delete restrict,
  unique (payment_id, rent_charge_id)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  property_id uuid,
  unit_id uuid,
  category text not null,
  description text not null,
  amount_minor bigint not null check (amount_minor > 0),
  incurred_on date not null,
  vendor_name text,
  reference text,
  status public.expense_status not null default 'recorded',
  recorded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (property_id, organization_id) references public.properties(id, organization_id) on delete restrict,
  foreign key (unit_id, organization_id) references public.units(id, organization_id) on delete restrict,
  check (unit_id is null or property_id is not null)
);

create index organization_members_user_idx on public.organization_members(user_id);
create index properties_org_idx on public.properties(organization_id);
create index units_org_property_idx on public.units(organization_id, property_id);
create index tenants_org_idx on public.tenants(organization_id);
create index leases_org_status_idx on public.leases(organization_id, status);
create index rent_charges_org_due_idx on public.rent_charges(organization_id, due_date, status);
create index payments_org_received_idx on public.payments(organization_id, received_at desc);
create index payment_allocations_charge_idx on public.payment_allocations(organization_id, rent_charge_id);
create index expenses_org_date_idx on public.expenses(organization_id, incurred_on desc);

-- Enable RLS on all application tables. Policies are added in the next security pass.
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.properties enable row level security;
alter table public.units enable row level security;
alter table public.owners enable row level security;
alter table public.property_owners enable row level security;
alter table public.tenants enable row level security;
alter table public.leases enable row level security;
alter table public.rent_charges enable row level security;
alter table public.payments enable row level security;
alter table public.payment_allocations enable row level security;
alter table public.expenses enable row level security;


-- RentFlow initial row-level security policies.
-- Apply after supabase/schema.sql in a development database and test with
-- multiple users belonging to different organisations before production.

-- A user can read an organisation if they created it or are a member.
create policy "organizations_select_member_or_creator"
on public.organizations for select to authenticated
using (
  created_by = (select auth.uid())
  or exists (
    select 1 from public.organization_members m
    where m.organization_id = organizations.id
      and m.user_id = (select auth.uid())
  )
);

create policy "organizations_insert_creator"
on public.organizations for insert to authenticated
with check (created_by = (select auth.uid()));

create policy "organizations_update_creator"
on public.organizations for update to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

-- Membership bootstrap: a user can create the first membership only for an
-- organisation they created. Existing users can read their own membership.
create policy "organization_members_select_self"
on public.organization_members for select to authenticated
using (user_id = (select auth.uid()));

create policy "organization_members_insert_creator"
on public.organization_members for insert to authenticated
with check (
  exists (
    select 1 from public.organizations o
    where o.id = organization_members.organization_id
      and o.created_by = (select auth.uid())
  )
  and (
    user_id = (select auth.uid())
    and role = 'owner'
  )
);

-- Every tenant-owned business table is scoped by an organisation membership.
-- These baseline policies grant CRUD to members. Role-specific permissions
-- (e.g. staff cannot reverse payments) will be layered on in the permissions
-- pass, and critical financial actions will use audited database operations.
create policy "properties_org_member_access"
on public.properties for all to authenticated
using (exists (
  select 1 from public.organization_members m
  where m.organization_id = properties.organization_id
    and m.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.organization_members m
  where m.organization_id = properties.organization_id
    and m.user_id = (select auth.uid())
));

create policy "units_org_member_access"
on public.units for all to authenticated
using (exists (
  select 1 from public.organization_members m
  where m.organization_id = units.organization_id
    and m.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.organization_members m
  where m.organization_id = units.organization_id
    and m.user_id = (select auth.uid())
));

create policy "owners_org_member_access"
on public.owners for all to authenticated
using (exists (
  select 1 from public.organization_members m
  where m.organization_id = owners.organization_id
    and m.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.organization_members m
  where m.organization_id = owners.organization_id
    and m.user_id = (select auth.uid())
));

create policy "property_owners_org_member_access"
on public.property_owners for all to authenticated
using (exists (
  select 1 from public.organization_members m
  where m.organization_id = property_owners.organization_id
    and m.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.organization_members m
  where m.organization_id = property_owners.organization_id
    and m.user_id = (select auth.uid())
));

create policy "tenants_org_member_access"
on public.tenants for all to authenticated
using (exists (
  select 1 from public.organization_members m
  where m.organization_id = tenants.organization_id
    and m.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.organization_members m
  where m.organization_id = tenants.organization_id
    and m.user_id = (select auth.uid())
));

create policy "leases_org_member_access"
on public.leases for all to authenticated
using (exists (
  select 1 from public.organization_members m
  where m.organization_id = leases.organization_id
    and m.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.organization_members m
  where m.organization_id = leases.organization_id
    and m.user_id = (select auth.uid())
));

create policy "rent_charges_org_member_access"
on public.rent_charges for all to authenticated
using (exists (
  select 1 from public.organization_members m
  where m.organization_id = rent_charges.organization_id
    and m.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.organization_members m
  where m.organization_id = rent_charges.organization_id
    and m.user_id = (select auth.uid())
));

create policy "payments_org_member_access"
on public.payments for all to authenticated
using (exists (
  select 1 from public.organization_members m
  where m.organization_id = payments.organization_id
    and m.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.organization_members m
  where m.organization_id = payments.organization_id
    and m.user_id = (select auth.uid())
));

create policy "payment_allocations_org_member_access"
on public.payment_allocations for all to authenticated
using (exists (
  select 1 from public.organization_members m
  where m.organization_id = payment_allocations.organization_id
    and m.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.organization_members m
  where m.organization_id = payment_allocations.organization_id
    and m.user_id = (select auth.uid())
));

create policy "expenses_org_member_access"
on public.expenses for all to authenticated
using (exists (
  select 1 from public.organization_members m
  where m.organization_id = expenses.organization_id
    and m.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.organization_members m
  where m.organization_id = expenses.organization_id
    and m.user_id = (select auth.uid())
));
