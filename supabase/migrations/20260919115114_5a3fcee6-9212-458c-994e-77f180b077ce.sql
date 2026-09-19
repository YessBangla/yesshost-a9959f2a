
-- 1. Chart of accounts
CREATE TABLE public.ledger_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name_bn text NOT NULL,
  name_en text NOT NULL,
  type text NOT NULL CHECK (type IN ('asset','liability','equity','income','expense')),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_accounts TO authenticated;
GRANT ALL ON public.ledger_accounts TO service_role;
ALTER TABLE public.ledger_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage chart of accounts" ON public.ledger_accounts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Dhaka')::date,
  reference text NOT NULL,
  description text,
  source text NOT NULL DEFAULT 'manual',
  source_id uuid,
  user_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX journal_entries_source_unique ON public.journal_entries (source, source_id) WHERE source_id IS NOT NULL;
CREATE INDEX journal_entries_date_idx ON public.journal_entries (entry_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage journal entries" ON public.journal_entries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.journal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.ledger_accounts(id),
  debit_bdt numeric NOT NULL DEFAULT 0,
  credit_bdt numeric NOT NULL DEFAULT 0,
  memo text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX journal_lines_entry_idx ON public.journal_lines (entry_id);
CREATE INDEX journal_lines_account_idx ON public.journal_lines (account_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_lines TO authenticated;
GRANT ALL ON public.journal_lines TO service_role;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage journal lines" ON public.journal_lines FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER ledger_accounts_updated_at BEFORE UPDATE ON public.ledger_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER journal_entries_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Seed chart of accounts
INSERT INTO public.ledger_accounts (code, name_bn, name_en, type, sort_order) VALUES
  ('1000','নগদ ও ব্যাংক','Cash & Bank','asset',10),
  ('1100','প্রাপ্য হিসাব','Accounts Receivable','asset',20),
  ('2000','ক্লায়েন্ট ওয়ালেট দায়','Client Wallet Liability','liability',30),
  ('2100','অ্যাফিলিয়েট কমিশন দায়','Affiliate Commission Payable','liability',40),
  ('3000','মূলধন','Owner Equity','equity',50),
  ('4000','হোস্টিং ও সেবা আয়','Hosting & Service Revenue','income',60),
  ('4100','থিম বিক্রয় আয়','Theme Sales Revenue','income',70),
  ('5000','সার্ভার ও ডেটাসেন্টার','Servers & Datacenter','expense',80),
  ('5100','বেতন','Salaries','expense',90),
  ('5200','মার্কেটিং','Marketing','expense',100),
  ('5300','সফটওয়্যার ও লাইসেন্স','Software & Licences','expense',110),
  ('5400','অফিস','Office','expense',120),
  ('5900','অন্যান্য ব্যয়','Other Expenses','expense',130);

-- 3. Helper to post a two-line entry
CREATE OR REPLACE FUNCTION public.post_journal_entry(
  _entry_date date, _reference text, _description text, _source text, _source_id uuid,
  _user_id uuid, _debit_code text, _credit_code text, _amount numeric
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _entry_id uuid; _debit uuid; _credit uuid;
BEGIN
  IF _amount IS NULL OR _amount = 0 THEN RETURN NULL; END IF;
  SELECT id INTO _debit FROM public.ledger_accounts WHERE code = _debit_code;
  SELECT id INTO _credit FROM public.ledger_accounts WHERE code = _credit_code;
  IF _debit IS NULL OR _credit IS NULL THEN RETURN NULL; END IF;

  IF _source_id IS NOT NULL THEN
    SELECT id INTO _entry_id FROM public.journal_entries WHERE source = _source AND source_id = _source_id;
    IF _entry_id IS NOT NULL THEN
      DELETE FROM public.journal_lines WHERE entry_id = _entry_id;
      UPDATE public.journal_entries SET entry_date = _entry_date, reference = _reference, description = _description, user_id = _user_id, updated_at = now() WHERE id = _entry_id;
    END IF;
  END IF;

  IF _entry_id IS NULL THEN
    INSERT INTO public.journal_entries (entry_date, reference, description, source, source_id, user_id)
    VALUES (_entry_date, _reference, _description, _source, _source_id, _user_id)
    RETURNING id INTO _entry_id;
  END IF;

  INSERT INTO public.journal_lines (entry_id, account_id, debit_bdt, credit_bdt, memo)
  VALUES (_entry_id, _debit, _amount, 0, _description), (_entry_id, _credit, 0, _amount, _description);
  RETURN _entry_id;
END; $$;

CREATE OR REPLACE FUNCTION public.expense_account_code(_category text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE _category
    WHEN 'server' THEN '5000' WHEN 'salary' THEN '5100' WHEN 'marketing' THEN '5200'
    WHEN 'software' THEN '5300' WHEN 'office' THEN '5400' ELSE '5900' END;
$$;

-- 4. Auto posting triggers
CREATE OR REPLACE FUNCTION public.post_invoice_payment_to_ledger() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'paid' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'paid') THEN
    PERFORM public.post_journal_entry(
      COALESCE(NEW.paid_at, now())::date, NEW.invoice_number,
      COALESCE(NEW.description, 'Invoice payment'), 'invoice', NEW.id, NEW.user_id,
      '1000', '4000', NEW.amount_bdt);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER invoices_ledger_posting AFTER INSERT OR UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.post_invoice_payment_to_ledger();

CREATE OR REPLACE FUNCTION public.post_wallet_txn_to_ledger() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('completed','approved','success') THEN
    IF NEW.type IN ('deposit','topup','credit','refund') THEN
      PERFORM public.post_journal_entry(NEW.created_at::date, COALESCE(NEW.transaction_id, left(NEW.id::text, 8)),
        COALESCE(NEW.description, 'Wallet deposit'), 'wallet', NEW.id, NEW.user_id, '1000', '2000', NEW.amount_bdt);
    ELSE
      PERFORM public.post_journal_entry(NEW.created_at::date, COALESCE(NEW.transaction_id, left(NEW.id::text, 8)),
        COALESCE(NEW.description, 'Wallet usage'), 'wallet', NEW.id, NEW.user_id, '2000', '1000', NEW.amount_bdt);
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER wallet_transactions_ledger_posting AFTER INSERT OR UPDATE ON public.wallet_transactions FOR EACH ROW EXECUTE FUNCTION public.post_wallet_txn_to_ledger();

CREATE OR REPLACE FUNCTION public.post_expense_to_ledger() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.journal_entries WHERE source = 'expense' AND source_id = OLD.id;
    RETURN OLD;
  END IF;
  PERFORM public.post_journal_entry(NEW.expense_date, COALESCE(NEW.vendor, NEW.title), NEW.title, 'expense', NEW.id, NULL,
    public.expense_account_code(NEW.category), '1000', NEW.amount_bdt);
  RETURN NEW;
END; $$;
CREATE TRIGGER operating_expenses_ledger_posting AFTER INSERT OR UPDATE OR DELETE ON public.operating_expenses FOR EACH ROW EXECUTE FUNCTION public.post_expense_to_ledger();

-- 5. Backfill existing data
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM public.invoices WHERE status = 'paid' LOOP
    PERFORM public.post_journal_entry(COALESCE(r.paid_at, r.created_at)::date, r.invoice_number, COALESCE(r.description,'Invoice payment'), 'invoice', r.id, r.user_id, '1000','4000', r.amount_bdt);
  END LOOP;
  FOR r IN SELECT * FROM public.wallet_transactions WHERE status IN ('completed','approved','success') LOOP
    IF r.type IN ('deposit','topup','credit','refund') THEN
      PERFORM public.post_journal_entry(r.created_at::date, COALESCE(r.transaction_id, left(r.id::text,8)), COALESCE(r.description,'Wallet deposit'), 'wallet', r.id, r.user_id, '1000','2000', r.amount_bdt);
    ELSE
      PERFORM public.post_journal_entry(r.created_at::date, COALESCE(r.transaction_id, left(r.id::text,8)), COALESCE(r.description,'Wallet usage'), 'wallet', r.id, r.user_id, '2000','1000', r.amount_bdt);
    END IF;
  END LOOP;
  FOR r IN SELECT * FROM public.operating_expenses LOOP
    PERFORM public.post_journal_entry(r.expense_date, COALESCE(r.vendor, r.title), r.title, 'expense', r.id, NULL, public.expense_account_code(r.category), '1000', r.amount_bdt);
  END LOOP;
END $$;

-- 6. Reporting functions
CREATE OR REPLACE FUNCTION public.accounts_trial_balance(_from date DEFAULT NULL, _to date DEFAULT NULL)
RETURNS TABLE (code text, name_bn text, name_en text, type text, debit_total numeric, credit_total numeric, balance numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.code, a.name_bn, a.name_en, a.type,
    COALESCE(SUM(l.debit_bdt),0), COALESCE(SUM(l.credit_bdt),0),
    CASE WHEN a.type IN ('asset','expense') THEN COALESCE(SUM(l.debit_bdt),0) - COALESCE(SUM(l.credit_bdt),0)
         ELSE COALESCE(SUM(l.credit_bdt),0) - COALESCE(SUM(l.debit_bdt),0) END
  FROM public.ledger_accounts a
  LEFT JOIN public.journal_lines l ON l.account_id = a.id
  LEFT JOIN public.journal_entries e ON e.id = l.entry_id
   AND (_from IS NULL OR e.entry_date >= _from) AND (_to IS NULL OR e.entry_date <= _to)
  WHERE public.has_role(auth.uid(), 'admin')
  GROUP BY a.code, a.name_bn, a.name_en, a.type, a.sort_order
  ORDER BY a.sort_order;
$$;

CREATE OR REPLACE FUNCTION public.accounts_period_summary(_granularity text DEFAULT 'day', _from date DEFAULT NULL, _to date DEFAULT NULL)
RETURNS TABLE (period_start date, income numeric, expense numeric, net numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT date_trunc(CASE WHEN _granularity IN ('day','week','month','year') THEN _granularity ELSE 'day' END, e.entry_date)::date AS period_start,
    COALESCE(SUM(CASE WHEN a.type = 'income' THEN l.credit_bdt - l.debit_bdt ELSE 0 END),0) AS income,
    COALESCE(SUM(CASE WHEN a.type = 'expense' THEN l.debit_bdt - l.credit_bdt ELSE 0 END),0) AS expense,
    COALESCE(SUM(CASE WHEN a.type = 'income' THEN l.credit_bdt - l.debit_bdt WHEN a.type = 'expense' THEN -(l.debit_bdt - l.credit_bdt) ELSE 0 END),0) AS net
  FROM public.journal_entries e
  JOIN public.journal_lines l ON l.entry_id = e.id
  JOIN public.ledger_accounts a ON a.id = l.account_id
  WHERE public.has_role(auth.uid(), 'admin')
    AND (_from IS NULL OR e.entry_date >= _from) AND (_to IS NULL OR e.entry_date <= _to)
    AND a.type IN ('income','expense')
  GROUP BY 1 ORDER BY 1;
$$;

GRANT EXECUTE ON FUNCTION public.accounts_trial_balance(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accounts_period_summary(text, date, date) TO authenticated;
