ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS wallet_transactions_one_completed_payment_per_invoice ON public.wallet_transactions(invoice_id) WHERE invoice_id IS NOT NULL AND type = 'payment' AND status = 'completed';

CREATE OR REPLACE FUNCTION public.pay_invoice_from_wallet(_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _invoice public.invoices%ROWTYPE;
  _balance numeric := 0;
  _paid_at timestamptz := now();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT * INTO _invoice FROM public.invoices WHERE id = _invoice_id AND user_id = _uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'invoice_not_found'; END IF;
  IF _invoice.status NOT IN ('unpaid','overdue') THEN
    RETURN jsonb_build_object('success', true, 'already_paid', true);
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(_uid::text, 0));
  SELECT COALESCE(sum(CASE WHEN type IN ('deposit','refund','credit') THEN amount_bdt ELSE -amount_bdt END), 0)
    INTO _balance FROM public.wallet_transactions WHERE user_id = _uid AND status IN ('completed','approved','success');
  IF _balance < _invoice.amount_bdt THEN
    RAISE EXCEPTION 'insufficient_balance:%:%', _balance, _invoice.amount_bdt;
  END IF;

  INSERT INTO public.wallet_transactions(user_id,type,amount_bdt,status,payment_method,description,transaction_id,invoice_id)
  VALUES (_uid,'payment',_invoice.amount_bdt,'completed','wallet','Invoice payment: ' || _invoice.invoice_number,'WP-' || _invoice.id::text,_invoice.id);

  UPDATE public.invoices SET status='paid', paid_at=_paid_at, payment_method='wallet', updated_at=_paid_at WHERE id=_invoice.id;
  UPDATE public.orders SET payment_status='paid', paid_at=_paid_at, payment_method='wallet', status='confirmed', confirmed_at=COALESCE(confirmed_at,_paid_at), updated_at=_paid_at WHERE invoice_id=_invoice.id AND user_id=_uid;
  INSERT INTO public.notifications(user_id,title,message,type,metadata)
  VALUES (_uid,'Payment Successful','Invoice ' || _invoice.invoice_number || ' paid via wallet (৳' || _invoice.amount_bdt || ')','payment_success',jsonb_build_object('invoice_id',_invoice.id,'amount',_invoice.amount_bdt,'method','wallet'));

  RETURN jsonb_build_object('success',true,'new_balance',_balance-_invoice.amount_bdt,'invoice_id',_invoice.id);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('success',true,'already_paid',true);
END;
$$;
REVOKE ALL ON FUNCTION public.pay_invoice_from_wallet(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pay_invoice_from_wallet(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.verify_support_pin(_user_id uuid, _pin text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _row public.support_pins%ROWTYPE;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'call_center')) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO _row FROM public.support_pins WHERE user_id=_user_id;
  IF NOT FOUND THEN RETURN 'missing'; END IF;
  IF _row.expires_at <= now() THEN RETURN 'expired'; END IF;
  IF length(_pin) <> 6 THEN RETURN 'invalid'; END IF;
  RETURN CASE WHEN extensions.crypt(_pin, extensions.crypt(_row.pin, '$2a$06$')) = extensions.crypt(_row.pin, extensions.crypt(_row.pin, '$2a$06$')) THEN 'valid' ELSE 'invalid' END;
END;
$$;
REVOKE ALL ON FUNCTION public.verify_support_pin(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_support_pin(uuid,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.guard_invoice_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  IF public.has_role(auth.uid(),'call_center') AND (NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.invoice_number IS DISTINCT FROM OLD.invoice_number OR NEW.amount_bdt IS DISTINCT FROM OLD.amount_bdt OR NEW.paid_at IS DISTINCT FROM OLD.paid_at) THEN
    RAISE EXCEPTION 'Call-center staff cannot change protected invoice fields';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_invoice_update_trigger ON public.invoices;
CREATE TRIGGER guard_invoice_update_trigger BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.guard_invoice_update();

CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  order_updates boolean NOT NULL DEFAULT true,
  payment_billing boolean NOT NULL DEFAULT true,
  support_tickets boolean NOT NULL DEFAULT true,
  service_status boolean NOT NULL DEFAULT true,
  offers_promotions boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients manage own notification preferences" ON public.notification_preferences FOR ALL TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();