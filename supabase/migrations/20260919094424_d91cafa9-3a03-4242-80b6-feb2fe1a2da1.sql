ALTER TABLE public.theme_orders ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS theme_orders_invoice_id_idx ON public.theme_orders(invoice_id);

CREATE OR REPLACE FUNCTION public.settle_theme_orders_on_invoice_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
    UPDATE public.theme_orders
    SET status = 'paid',
        paid_at = COALESCE(NEW.paid_at, now()),
        payment_method = COALESCE(NEW.payment_method, payment_method),
        updated_at = now()
    WHERE invoice_id = NEW.id AND status <> 'paid';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS settle_theme_orders_on_invoice_paid ON public.invoices;
CREATE TRIGGER settle_theme_orders_on_invoice_paid
AFTER UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.settle_theme_orders_on_invoice_paid();