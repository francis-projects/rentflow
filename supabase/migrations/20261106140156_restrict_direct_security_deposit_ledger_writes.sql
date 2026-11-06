drop policy if exists security_deposit_finance_insert on public.security_deposit_transactions;
revoke insert,update,delete on public.security_deposit_transactions from authenticated;
grant select on public.security_deposit_transactions to authenticated;
