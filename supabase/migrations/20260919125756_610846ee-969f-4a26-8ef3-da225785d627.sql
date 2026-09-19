REVOKE ALL ON FUNCTION public.guard_invoice_update() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_invoice_update() TO service_role;