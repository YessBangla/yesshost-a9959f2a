CREATE OR REPLACE FUNCTION public.set_support_pin_for_user(_user_id uuid, _pin text, _expires_at timestamptz)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF _pin !~ '^[0-9]{6}$' THEN RAISE EXCEPTION 'invalid_pin'; END IF;
  IF _expires_at <= now() OR _expires_at > now() + interval '2 hours' THEN RAISE EXCEPTION 'invalid_expiry'; END IF;
  INSERT INTO public.support_pins(user_id,pin,expires_at)
  VALUES (_user_id, crypt(_pin, gen_salt('bf', 8)), _expires_at)
  ON CONFLICT (user_id) DO UPDATE SET pin=excluded.pin,expires_at=excluded.expires_at,updated_at=now();
END;
$$;
REVOKE ALL ON FUNCTION public.set_support_pin_for_user(uuid,text,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_support_pin_for_user(uuid,text,timestamptz) TO service_role;