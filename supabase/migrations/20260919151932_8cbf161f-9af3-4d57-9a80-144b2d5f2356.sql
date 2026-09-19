create or replace function public.accounts_reconciliation(_from date, _to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_invoices numeric := 0;
  v_ledger numeric := 0;
  v_payments numeric := 0;
  v_missing jsonb := '[]'::jsonb;
  v_orphan jsonb := '[]'::jsonb;
begin
  select coalesce(sum(i.amount_bdt),0) into v_invoices
  from public.invoices i
  where i.status = 'paid' and i.paid_at is not null
    and (i.paid_at at time zone 'UTC')::date between _from and _to;

  select coalesce(sum(jl.credit_bdt - jl.debit_bdt),0) into v_ledger
  from public.journal_lines jl
  join public.journal_entries je on je.id = jl.entry_id
  join public.ledger_accounts la on la.id = jl.account_id
  where la.type = 'income' and je.entry_date between _from and _to;

  select coalesce(sum(pe.amount_bdt),0) into v_payments
  from public.payment_events pe
  where pe.status = 'completed'
    and (pe.created_at at time zone 'UTC')::date between _from and _to;

  select coalesce(jsonb_agg(x), '[]'::jsonb) into v_missing
  from (
    select i.id, i.invoice_number, i.amount_bdt, i.paid_at
    from public.invoices i
    where i.status = 'paid' and i.paid_at is not null
      and (i.paid_at at time zone 'UTC')::date between _from and _to
      and not exists (
        select 1 from public.journal_entries je
        where je.source = 'invoice' and je.source_id = i.id
      )
    order by i.paid_at desc
    limit 200
  ) x;

  select coalesce(jsonb_agg(y), '[]'::jsonb) into v_orphan
  from (
    select je.id, je.entry_date, je.reference, je.description, je.source_id
    from public.journal_entries je
    where je.source = 'invoice'
      and je.entry_date between _from and _to
      and not exists (
        select 1 from public.invoices i
        where i.id = je.source_id and i.status = 'paid'
      )
    order by je.entry_date desc
    limit 200
  ) y;

  return jsonb_build_object(
    'from', _from,
    'to', _to,
    'invoices_paid_total', v_invoices,
    'ledger_income_total', v_ledger,
    'payment_events_total', v_payments,
    'invoice_ledger_diff', v_invoices - v_ledger,
    'invoice_payment_diff', v_invoices - v_payments,
    'missing_ledger_entries', v_missing,
    'orphan_ledger_entries', v_orphan
  );
end;
$$;

revoke all on function public.accounts_reconciliation(date, date) from public, anon, authenticated;
grant execute on function public.accounts_reconciliation(date, date) to service_role;