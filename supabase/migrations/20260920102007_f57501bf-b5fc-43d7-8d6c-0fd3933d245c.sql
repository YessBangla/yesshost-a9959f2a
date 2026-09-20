CREATE TABLE public.reseller_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reseller_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reseller_account_id UUID REFERENCES public.reseller_accounts(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  domain TEXT,
  description TEXT,
  amount_bdt NUMERIC NOT NULL DEFAULT 0 CHECK (amount_bdt >= 0),
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid','overdue','cancelled')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reseller_invoices_user ON public.reseller_invoices (reseller_user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reseller_invoices TO authenticated;
GRANT ALL ON public.reseller_invoices TO service_role;

ALTER TABLE public.reseller_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resellers manage their own customer invoices"
ON public.reseller_invoices FOR ALL TO authenticated
USING (auth.uid() = reseller_user_id)
WITH CHECK (auth.uid() = reseller_user_id);

CREATE POLICY "Admins can view all reseller invoices"
ON public.reseller_invoices FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_reseller_invoices_updated_at
BEFORE UPDATE ON public.reseller_invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();