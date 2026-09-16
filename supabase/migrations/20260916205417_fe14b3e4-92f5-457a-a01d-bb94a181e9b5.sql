ALTER TABLE public.themes
  ADD COLUMN IF NOT EXISTS seller_user_id uuid,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS approval_note text,
  ADD COLUMN IF NOT EXISTS commission_rate numeric NOT NULL DEFAULT 30;

CREATE INDEX IF NOT EXISTS idx_themes_seller ON public.themes(seller_user_id);

DROP POLICY IF EXISTS "Sellers can view their own themes" ON public.themes;
CREATE POLICY "Sellers can view their own themes" ON public.themes
  FOR SELECT TO authenticated
  USING (seller_user_id = auth.uid());

DROP POLICY IF EXISTS "Sellers can create their own themes" ON public.themes;
CREATE POLICY "Sellers can create their own themes" ON public.themes
  FOR INSERT TO authenticated
  WITH CHECK (seller_user_id = auth.uid() AND approval_status = 'pending' AND COALESCE(is_active, false) = false);

DROP POLICY IF EXISTS "Sellers can update their own themes" ON public.themes;
CREATE POLICY "Sellers can update their own themes" ON public.themes
  FOR UPDATE TO authenticated
  USING (seller_user_id = auth.uid())
  WITH CHECK (seller_user_id = auth.uid());

DROP POLICY IF EXISTS "Sellers can delete their own themes" ON public.themes;
CREATE POLICY "Sellers can delete their own themes" ON public.themes
  FOR DELETE TO authenticated
  USING (seller_user_id = auth.uid() AND approval_status <> 'approved');

CREATE TABLE IF NOT EXISTS public.theme_seller_payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount_bdt numeric NOT NULL,
  method text NOT NULL,
  account_details text NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone
);

GRANT SELECT, INSERT ON public.theme_seller_payouts TO authenticated;
GRANT ALL ON public.theme_seller_payouts TO service_role;

ALTER TABLE public.theme_seller_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers view own theme payouts" ON public.theme_seller_payouts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sellers request theme payouts" ON public.theme_seller_payouts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'requested');

CREATE POLICY "Admins manage theme payouts" ON public.theme_seller_payouts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT UPDATE ON public.theme_seller_payouts TO authenticated;