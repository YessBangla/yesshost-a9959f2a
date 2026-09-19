REVOKE ALL ON FUNCTION public.accounts_period_summary(text,date,date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accounts_period_summary(text,date,date) TO service_role;
REVOKE ALL ON FUNCTION public.accounts_trial_balance(date,date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accounts_trial_balance(date,date) TO service_role;
REVOKE ALL ON FUNCTION public.pay_invoice_from_wallet(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pay_invoice_from_wallet(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.verify_support_pin(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_support_pin(uuid,text) TO service_role;

CREATE OR REPLACE FUNCTION public.pay_invoice_from_wallet_for_user(_invoice_id uuid, _user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  _invoice public.invoices%ROWTYPE;
  _balance numeric := 0;
  _paid_at timestamptz := now();
  _service public.services%ROWTYPE;
  _years integer := 1;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT * INTO _invoice FROM public.invoices WHERE id=_invoice_id AND user_id=_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'invoice_not_found'; END IF;
  IF _invoice.status NOT IN ('unpaid','overdue') THEN
    RETURN jsonb_build_object('success',true,'already_paid',true);
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(_user_id::text,0));
  SELECT COALESCE(sum(CASE WHEN type IN ('deposit','refund','credit') THEN amount_bdt ELSE -amount_bdt END),0)
    INTO _balance FROM public.wallet_transactions WHERE user_id=_user_id AND status IN ('completed','approved','success');
  IF _balance < _invoice.amount_bdt THEN RAISE EXCEPTION 'insufficient_balance:%:%',_balance,_invoice.amount_bdt; END IF;

  INSERT INTO public.wallet_transactions(user_id,type,amount_bdt,status,payment_method,description,transaction_id,invoice_id)
  VALUES (_user_id,'payment',_invoice.amount_bdt,'completed','wallet','Invoice payment: '||_invoice.invoice_number,'WP-'||_invoice.id::text,_invoice.id);
  UPDATE public.invoices SET status='paid',paid_at=_paid_at,payment_method='wallet',updated_at=_paid_at WHERE id=_invoice.id;
  UPDATE public.orders SET payment_status='paid',paid_at=_paid_at,payment_method='wallet',status='confirmed',confirmed_at=COALESCE(confirmed_at,_paid_at),updated_at=_paid_at WHERE invoice_id=_invoice.id AND user_id=_user_id;

  IF _invoice.service_id IS NOT NULL AND lower(COALESCE(_invoice.description,'')) LIKE '%domain renewal%' THEN
    SELECT * INTO _service FROM public.services WHERE id=_invoice.service_id AND user_id=_user_id FOR UPDATE;
    IF FOUND THEN
      _years := COALESCE(NULLIF(substring(_invoice.description from '(\d+)y @'),'')::integer,1);
      UPDATE public.services SET status='active',expiry_date=(CASE WHEN _service.expiry_date>_paid_at THEN _service.expiry_date ELSE _paid_at END)+make_interval(years=>_years),updated_at=_paid_at WHERE id=_service.id;
    END IF;
  END IF;

  INSERT INTO public.notifications(user_id,title,message,type,metadata)
  VALUES (_user_id,'Payment Successful','Invoice '||_invoice.invoice_number||' paid via wallet (৳'||_invoice.amount_bdt||')','payment_success',jsonb_build_object('invoice_id',_invoice.id,'amount',_invoice.amount_bdt,'method','wallet'));
  RETURN jsonb_build_object('success',true,'new_balance',_balance-_invoice.amount_bdt,'invoice_id',_invoice.id);
EXCEPTION WHEN unique_violation THEN
  IF EXISTS (SELECT 1 FROM public.wallet_transactions WHERE invoice_id=_invoice_id AND type='payment' AND status='completed') THEN
    RETURN jsonb_build_object('success',true,'already_paid',true);
  END IF;
  RAISE;
END;
$$;
REVOKE ALL ON FUNCTION public.pay_invoice_from_wallet_for_user(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pay_invoice_from_wallet_for_user(uuid,uuid) TO service_role;