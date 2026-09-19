ALTER TABLE public.live_chats ADD COLUMN IF NOT EXISTS visitor_token_hash text;

DROP POLICY IF EXISTS "Visitors can insert messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Insert messages for own or anonymous chat" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Insert call history for own or anonymous chat" ON public.call_history;

DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can create own theme orders" ON public.theme_orders;
DROP POLICY IF EXISTS "Users can update own pending wallet transactions" ON public.wallet_transactions;

CREATE OR REPLACE FUNCTION public.guard_wallet_transactions_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF private.has_role(auth.uid(), 'admin') OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  NEW.user_id := OLD.user_id;
  NEW.amount_bdt := OLD.amount_bdt;
  NEW.type := OLD.type;
  NEW.payment_method := OLD.payment_method;
  NEW.transaction_id := OLD.transaction_id;
  NEW.description := OLD.description;
  NEW.invoice_id := OLD.invoice_id;
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT (OLD.status = 'pending' AND NEW.status = 'cancelled') THEN
    NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END
$$;

CREATE POLICY "Users can cancel own pending wallet transactions"
ON public.wallet_transactions FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'cancelled');