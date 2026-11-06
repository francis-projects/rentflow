-- Subscription prices are denominated in USD. Rental operations remain UGX.
update public.subscription_plans set currency_code='USD' where currency_code <> 'USD';
