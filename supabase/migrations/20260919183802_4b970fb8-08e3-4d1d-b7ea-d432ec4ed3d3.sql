CREATE OR REPLACE FUNCTION public.guard_wallet_transaction_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT private.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.amount_bdt := OLD.amount_bdt;
    NEW.type := OLD.type;
    NEW.user_id := OLD.user_id;
    NEW.invoice_id := OLD.invoice_id;
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'cancelled' THEN
      NEW.status := OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.guard_wallet_transaction_fields() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_wallet_transaction_fields ON public.wallet_transactions;
CREATE TRIGGER guard_wallet_transaction_fields BEFORE UPDATE ON public.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION public.guard_wallet_transaction_fields();

DROP POLICY IF EXISTS "Users can view own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view own wallet transactions"
ON public.wallet_transactions FOR SELECT TO authenticated
USING (auth.uid() = user_id);