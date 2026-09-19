CREATE TABLE public.operating_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  amount_bdt numeric NOT NULL DEFAULT 0,
  expense_date date NOT NULL DEFAULT (now()::date),
  vendor text,
  note text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.operating_expenses TO authenticated;
GRANT ALL ON public.operating_expenses TO service_role;

ALTER TABLE public.operating_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view operating expenses"
ON public.operating_expenses FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can add operating expenses"
ON public.operating_expenses FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update operating expenses"
ON public.operating_expenses FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete operating expenses"
ON public.operating_expenses FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_operating_expenses_date ON public.operating_expenses (expense_date DESC);

CREATE TRIGGER set_operating_expenses_updated_at
BEFORE UPDATE ON public.operating_expenses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();