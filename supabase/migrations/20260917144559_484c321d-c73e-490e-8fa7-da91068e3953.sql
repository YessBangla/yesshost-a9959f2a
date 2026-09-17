DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
CREATE POLICY "Users can create own orders"
ON public.orders FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'::order_status
  AND payment_status = 'unpaid'
  AND paid_at IS NULL
);

DROP POLICY IF EXISTS "Users can insert own invoices" ON public.invoices;
CREATE POLICY "Users can insert own invoices"
ON public.invoices FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'unpaid'::invoice_status
  AND paid_at IS NULL
);

DROP POLICY IF EXISTS "Users can insert own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users can insert own wallet transactions"
ON public.wallet_transactions FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
);