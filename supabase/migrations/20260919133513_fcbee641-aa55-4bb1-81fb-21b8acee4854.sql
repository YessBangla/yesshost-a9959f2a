REVOKE EXECUTE ON FUNCTION public.create_order_secure(jsonb,text,text,text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_secure(jsonb,text,text,text) TO service_role;