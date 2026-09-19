CREATE OR REPLACE FUNCTION public.guard_live_chat_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Trusted server-side inserts (no session) keep whatever owner they set.
  IF auth.uid() IS NOT NULL AND NEW.user_id IS DISTINCT FROM auth.uid() THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END; $$;