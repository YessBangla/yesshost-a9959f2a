INSERT INTO public.ledger_accounts (code, name_bn, name_en, type, sort_order)
VALUES ('1001', 'নগদ তহবিল', 'Cash in Hand', 'asset', 12),
       ('1002', 'ব্যাংক হিসাব', 'Bank Account', 'asset', 14)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE public.cash_bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL CHECK (direction IN ('in','out')),
  method text NOT NULL CHECK (method IN ('cash','bank')),
  amount_bdt numeric NOT NULL CHECK (amount_bdt > 0),
  txn_date date NOT NULL DEFAULT CURRENT_DATE,
  counterparty text,
  bank_name text,
  account_number text,
  reference text,
  contra_code text NOT NULL DEFAULT '4000',
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  client_user_id uuid,
  note text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_bank_transactions TO authenticated;
GRANT ALL ON public.cash_bank_transactions TO service_role;

ALTER TABLE public.cash_bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage cash and bank transactions"
ON public.cash_bank_transactions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_cash_bank_updated_at
BEFORE UPDATE ON public.cash_bank_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.post_cash_bank_to_ledger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _asset_code text;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    DELETE FROM public.journal_entries WHERE source = 'cashbank' AND source_id = OLD.id;
    RETURN OLD;
  END IF;

  _asset_code := CASE WHEN NEW.method = 'bank' THEN '1002' ELSE '1001' END;

  PERFORM public.post_journal_entry(
    NEW.txn_date,
    COALESCE(NULLIF(NEW.reference, ''), 'CB-' || UPPER(SUBSTRING(NEW.id::text, 1, 8))),
    COALESCE(NEW.note, NEW.counterparty),
    'cashbank',
    NEW.id,
    NEW.client_user_id,
    CASE WHEN NEW.direction = 'in' THEN _asset_code ELSE NEW.contra_code END,
    CASE WHEN NEW.direction = 'in' THEN NEW.contra_code ELSE _asset_code END,
    NEW.amount_bdt
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER cash_bank_to_ledger
AFTER INSERT OR UPDATE OR DELETE ON public.cash_bank_transactions
FOR EACH ROW EXECUTE FUNCTION public.post_cash_bank_to_ledger();