
-- Fix overly permissive update policy on wallet_transactions
DROP POLICY "Service role can update wallet transactions" ON public.wallet_transactions;

-- Only allow users to see updates on own transactions (service role bypasses RLS anyway)
CREATE POLICY "Users can update own pending wallet transactions"
  ON public.wallet_transactions FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');
