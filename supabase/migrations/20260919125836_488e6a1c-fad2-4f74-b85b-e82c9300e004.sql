CREATE OR REPLACE FUNCTION public.guard_theme_seller_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  IF NEW.seller_user_id IS DISTINCT FROM OLD.seller_user_id OR NEW.approval_status IS DISTINCT FROM OLD.approval_status OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'Only administrators can approve or publish themes';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_theme_seller_update() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_theme_seller_update() TO service_role;
DROP TRIGGER IF EXISTS guard_theme_seller_update_trigger ON public.themes;
CREATE TRIGGER guard_theme_seller_update_trigger BEFORE UPDATE ON public.themes FOR EACH ROW EXECUTE FUNCTION public.guard_theme_seller_update();

CREATE POLICY "Admins can view payment gateway settings" ON public.payment_gateway_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can create payment gateway settings" ON public.payment_gateway_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update payment gateway settings" ON public.payment_gateway_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete payment gateway settings" ON public.payment_gateway_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));