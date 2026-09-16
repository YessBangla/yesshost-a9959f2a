-- otp_codes was missing its access rule
CREATE POLICY "Admins can view otp codes" ON public.otp_codes
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Internal trigger functions must not be callable through the API
REVOKE EXECUTE ON FUNCTION public.notify_staff_new_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.provision_order(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_coupon_usage(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_paid_invoice_commission() FROM PUBLIC, anon, authenticated;