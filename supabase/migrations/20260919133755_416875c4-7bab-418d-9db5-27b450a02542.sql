CREATE OR REPLACE FUNCTION public.set_support_pin(_pin text, _expires_at timestamptz)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF _pin !~ '^[0-9]{6}$' THEN RAISE EXCEPTION 'invalid_pin'; END IF;
  IF _expires_at <= now() OR _expires_at > now() + interval '2 hours' THEN RAISE EXCEPTION 'invalid_expiry'; END IF;
  INSERT INTO public.support_pins(user_id,pin,expires_at)
  VALUES (_uid, crypt(_pin, gen_salt('bf', 8)), _expires_at)
  ON CONFLICT (user_id) DO UPDATE SET pin=excluded.pin,expires_at=excluded.expires_at,updated_at=now();
END;
$$;
REVOKE ALL ON FUNCTION public.set_support_pin(text,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_support_pin(text,timestamptz) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.verify_support_pin(_user_id uuid, _pin text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE _row public.support_pins%ROWTYPE;
BEGIN
  IF NOT (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'call_center')) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO _row FROM public.support_pins WHERE user_id=_user_id;
  IF NOT FOUND THEN RETURN 'missing'; END IF;
  IF _row.expires_at <= now() THEN RETURN 'expired'; END IF;
  IF _pin !~ '^[0-9]{6}$' THEN RETURN 'invalid'; END IF;
  RETURN CASE WHEN _row.pin = crypt(_pin, _row.pin) THEN 'valid' ELSE 'invalid' END;
END;
$$;
REVOKE ALL ON FUNCTION public.verify_support_pin(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_support_pin(uuid,text) TO service_role;

UPDATE public.live_chats SET status='closed', updated_at=now() WHERE visitor_token_hash IS NULL AND status <> 'closed';