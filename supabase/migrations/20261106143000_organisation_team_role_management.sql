-- Organisation team administration with database-enforced role boundaries.
create or replace function private.is_org_owner(p_org_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
 select exists (select 1 from public.organization_members m
 where m.organization_id=p_org_id and m.user_id=(select auth.uid())
 and m.role='owner'::public.organization_role);
$$;
revoke all on function private.is_org_owner(uuid) from public, anon;
grant execute on function private.is_org_owner(uuid) to authenticated;

drop policy if exists organization_members_update_admin on public.organization_members;
drop policy if exists organization_members_delete_admin on public.organization_members;
create policy organization_members_update_admin on public.organization_members
for update to authenticated
using (private.has_org_role(organization_id,array['owner','admin']::public.organization_role[])
 and (role <> 'owner'::public.organization_role or private.is_org_owner(organization_id)))
with check (private.has_org_role(organization_id,array['owner','admin']::public.organization_role[])
 and (role <> 'owner'::public.organization_role or private.is_org_owner(organization_id)));
create policy organization_members_delete_admin on public.organization_members
for delete to authenticated
using (private.has_org_role(organization_id,array['owner','admin']::public.organization_role[])
 and (role <> 'owner'::public.organization_role or private.is_org_owner(organization_id)));

create or replace function private.guard_organization_owner_membership()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_owner_count integer;
begin
 if old.role='owner'::public.organization_role then
  if not private.is_org_owner(old.organization_id) then
   raise exception 'Only an organisation owner can change an owner membership';
  end if;
  if tg_op='DELETE' or new.role <> 'owner'::public.organization_role then
   select count(*) into v_owner_count from public.organization_members m
   where m.organization_id=old.organization_id and m.role='owner'::public.organization_role;
   if v_owner_count<=1 then raise exception 'An organisation must retain at least one owner'; end if;
  end if;
 end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end;
$$;
revoke all on function private.guard_organization_owner_membership() from public, anon, authenticated;
drop trigger if exists organization_owner_membership_guard on public.organization_members;
create trigger organization_owner_membership_guard before update or delete
on public.organization_members for each row execute function private.guard_organization_owner_membership();
