DROP POLICY IF EXISTS "Sellers can view orders of their themes" ON public.theme_orders;
CREATE POLICY "Sellers can view orders of their themes" ON public.theme_orders
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.themes t
    WHERE t.id = theme_orders.theme_id AND t.seller_user_id = auth.uid()
  ));