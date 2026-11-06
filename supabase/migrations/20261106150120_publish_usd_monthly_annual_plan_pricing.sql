-- Publish the active subscription catalogue for the public pricing page.
-- Prices are stored in USD cents. Annual pricing gives two months free.
update public.subscription_plans
set monthly_price_minor = case code
  when 'starter' then 1900
  when 'professional' then 4900
  else monthly_price_minor
end,
annual_price_minor = case code
  when 'starter' then 19000
  when 'professional' then 49000
  else annual_price_minor
end,
currency_code = 'USD'
where code in ('starter','professional','enterprise');

grant select on public.subscription_plans to anon;
drop policy if exists "Public can view active subscription plans" on public.subscription_plans;
create policy "Public can view active subscription plans"
on public.subscription_plans for select to anon
using (is_active = true);
