-- Create a workspace and owner membership automatically for each new Auth user.
-- Trigger runs in the database, so it also works when email confirmation is enabled.
create or replace function public.handle_new_user_workspace()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  workspace_name text;
  new_org_id uuid;
begin
  workspace_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'organization_name', '')), '');
  if workspace_name is null then
    workspace_name := coalesce(nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''), split_part(new.email, '@', 1)) || '''s Workspace';
  end if;

  insert into public.organizations (name, created_by)
  values (workspace_name, new.id)
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_workspace on auth.users;
create trigger on_auth_user_created_workspace
after insert on auth.users
for each row execute function public.handle_new_user_workspace();

revoke all on function public.handle_new_user_workspace() from public, anon, authenticated;
