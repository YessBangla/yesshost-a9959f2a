REVOKE EXECUTE ON FUNCTION public.set_support_pin(text,timestamptz) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.set_support_pin(text,timestamptz) TO service_role;