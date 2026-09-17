-- 1. Move the SECURITY DEFINER role checker out of the API-exposed schema
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
ALTER FUNCTION private.has_role(uuid, public.app_role) SET search_path = public, private;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

-- 2. Public RPC wrapper: SECURITY INVOKER, callers can only check their own roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT CASE
    WHEN auth.uid() IS NOT NULL AND _user_id = auth.uid()
      THEN private.has_role(_user_id, _role)
    ELSE false
  END
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 3. Stop users from self-approving theme purchases
DROP POLICY IF EXISTS "Users can create own theme orders" ON public.theme_orders;
CREATE POLICY "Users can create own theme orders"
ON public.theme_orders
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND paid_at IS NULL
);