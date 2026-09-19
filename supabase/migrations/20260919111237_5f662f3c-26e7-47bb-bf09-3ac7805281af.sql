CREATE TABLE IF NOT EXISTS public.support_pins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  pin text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_pins TO authenticated;
GRANT ALL ON public.support_pins TO service_role;

ALTER TABLE public.support_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own support pin"
  ON public.support_pins FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view support pins"
  ON public.support_pins FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'call_center'));

CREATE TRIGGER support_pins_updated_at
  BEFORE UPDATE ON public.support_pins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();