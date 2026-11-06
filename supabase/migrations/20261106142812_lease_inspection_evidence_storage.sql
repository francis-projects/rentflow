alter table public.lease_inspections add constraint lease_inspections_id_org_unique unique(id,organization_id);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('lease-inspection-evidence','lease-inspection-evidence',false,10485760,array['image/jpeg','image/png','application/pdf'])
on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;
create table public.lease_inspection_evidence(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete restrict,
 inspection_id uuid not null,
 file_name text not null,
 storage_path text not null unique,
 content_type text not null check(content_type in ('image/jpeg','image/png','application/pdf')),
 size_bytes bigint not null check(size_bytes>0 and size_bytes<=10485760),
 caption text not null default '',
 uploaded_by uuid not null references auth.users(id),
 uploaded_at timestamptz not null default now(),
 foreign key(inspection_id,organization_id) references public.lease_inspections(id,organization_id) on delete restrict
);
create index lease_inspection_evidence_inspection_idx on public.lease_inspection_evidence(organization_id,inspection_id,uploaded_at desc);
alter table public.lease_inspection_evidence enable row level security;
create policy lease_inspection_evidence_select on public.lease_inspection_evidence for select to authenticated using(private.is_org_member(organization_id));
create policy lease_inspection_evidence_insert on public.lease_inspection_evidence for insert to authenticated with check(uploaded_by=(select auth.uid()) and private.has_org_role(organization_id,array['owner','admin','manager','staff']::public.organization_role[]));
create policy lease_inspection_evidence_delete on public.lease_inspection_evidence for delete to authenticated using(private.has_org_role(organization_id,array['owner','admin','manager']::public.organization_role[]));
grant select,insert,delete on public.lease_inspection_evidence to authenticated;
create policy lease_inspection_evidence_storage_select on storage.objects for select to authenticated using(bucket_id='lease-inspection-evidence' and exists(select 1 from public.lease_inspection_evidence e where e.storage_path=name and private.is_org_member(e.organization_id)));
create policy lease_inspection_evidence_storage_insert on storage.objects for insert to authenticated with check(bucket_id='lease-inspection-evidence' and (storage.foldername(name))[1] in(select organization_id::text from public.organization_members where user_id=(select auth.uid())));
create policy lease_inspection_evidence_storage_delete on storage.objects for delete to authenticated using(bucket_id='lease-inspection-evidence' and exists(select 1 from public.lease_inspection_evidence e where e.storage_path=name and private.has_org_role(e.organization_id,array['owner','admin','manager']::public.organization_role[])));