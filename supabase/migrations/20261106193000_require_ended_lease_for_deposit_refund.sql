-- Refunds are recorded only after a lease is ended or terminated.
create or replace function public.record_security_deposit_transaction(p_organization_id uuid,p_lease_id uuid,p_transaction_type text,p_amount_minor bigint,p_description text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_lease public.leases%rowtype; v_id uuid;
begin
 if auth.uid() is null or not private.has_org_role(p_organization_id,array['owner','admin','manager','accountant']::public.organization_role[]) then raise exception 'Not authorised to manage security deposits'; end if;
 if p_transaction_type not in('received','refund') or p_amount_minor<=0 or length(trim(coalesce(p_description,'')))<3 then raise exception 'Enter valid deposit receipt or refund'; end if;
 select * into v_lease from public.leases where id=p_lease_id and organization_id=p_organization_id for update;
 if not found then raise exception 'Lease not found'; end if;
 if p_transaction_type='refund' and v_lease.status not in('ended','terminated') then raise exception 'A security deposit can only be refunded after the lease has ended or been terminated'; end if;
 insert into public.security_deposit_transactions(organization_id,lease_id,tenant_id,transaction_type,amount_minor,description,recorded_by)
 values(p_organization_id,p_lease_id,v_lease.tenant_id,p_transaction_type,p_amount_minor,trim(p_description),auth.uid()) returning id into v_id;
 return v_id;
end $$;
