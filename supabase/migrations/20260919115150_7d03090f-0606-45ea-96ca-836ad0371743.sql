
REVOKE ALL ON FUNCTION public.post_journal_entry(date, text, text, text, uuid, uuid, text, text, numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.post_invoice_payment_to_ledger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.post_wallet_txn_to_ledger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.post_expense_to_ledger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.accounts_trial_balance(date, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.accounts_period_summary(text, date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accounts_trial_balance(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accounts_period_summary(text, date, date) TO authenticated;
CREATE OR REPLACE FUNCTION public.expense_account_code(_category text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _category
    WHEN 'server' THEN '5000' WHEN 'salary' THEN '5100' WHEN 'marketing' THEN '5200'
    WHEN 'software' THEN '5300' WHEN 'office' THEN '5400' ELSE '5900' END;
$$;
