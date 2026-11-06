create table if not exists public.tenant_documents (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 tenant_id uuid not null,
 file_name text not null,
 storage_path text not null unique,
 content_type text not null,
 size_bytes bigint not null check(size_bytes>0 and size_bytes<=10485760),
 document_type text not null default 'other',
 notes text,
 uploaded_by uuid not null references auth.users(id),
 uploaded_at timestamptz not null default now(),
 constraint tenant_documents_tenant_org_fk foreign key(tenant_id,organization_id) references public.tenants(id,organization_id) on delete cascade
);
create index if not exists tenant_documents_tenant_idx on public.tenant_documents(tenant_id,organization_id,uploaded_at desc);
alter table public.tenant_documents enable row level security;
create policy tenant_documents_member_select on public.tenant_documents for select to authenticated using(private.is_org_member(organization_id));
create policy tenant_documents_manager_insert on public.tenant_documents for insert to authenticated with check(private.has_org_role(organization_id,array['owner','admin','manager','staff']::public.organization_role[]) and uploaded_by=(select auth.uid()));
create policy tenant_documents_manager_delete on public.tenant_documents for delete to authenticated using(private.has_org_role(organization_id,array['owner','admin','manager']::public.organization_role[]));
grant select,insert,delete on public.tenant_documents to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('tenant-documents','tenant-documents',false,10485760,array['application/pdf','image/jpeg','image/png'])
on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['application/pdf','image/jpeg','image/png'];
create policy tenant_docs_storage_select on storage.objects for select to authenticated using(bucket_id='tenant-documents' and private.is_org_member((storage.foldername(name))[1]::uuid));
create policy tenant_docs_storage_insert on storage.objects for insert to authenticated with check(bucket_id='tenant-documents' and private.has_org_role((storage.foldername(name))[1]::uuid,array['owner','admin','manager','staff']::public.organization_role[]));
create policy tenant_docs_storage_delete on storage.objects for delete to authenticated using(bucket_id='tenant-documents' and private.has_org_role((storage.foldername(name))[1]::uuid,array['owner','admin','manager']::public.organization_role[]));