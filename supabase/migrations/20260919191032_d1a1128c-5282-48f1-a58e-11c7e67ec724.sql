ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS share_token_hash text,
  ADD COLUMN IF NOT EXISTS share_expires_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS invoices_share_token_hash_key
  ON public.invoices (share_token_hash)
  WHERE share_token_hash IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_invoice_share_token(
  _invoice_id uuid,
  _token_hash text,
  _expires_at timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF length(_token_hash) <> 64 OR _expires_at <= now() OR _expires_at > now() + interval '31 days' THEN
    RAISE EXCEPTION 'Invalid share token';
  END IF;
  UPDATE public.invoices
  SET share_token_hash = _token_hash,
      share_expires_at = _expires_at
  WHERE id = _invoice_id
    AND user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_invoice_share_token(uuid, text, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_invoice_share_token(uuid, text, timestamptz) TO authenticated, service_role;